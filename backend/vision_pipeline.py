from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Any

import torch
from PIL import Image
from torch import nn
from torch.optim import AdamW
from torch.utils.data import DataLoader
from torchvision import datasets, models, transforms
from ultralytics import YOLO

SCRAP_CLASSES = ["Plastic", "Metal", "E-Waste", "Paper"]


@dataclass
class ScrapPrediction:
    material: str
    confidence: float
    condition_factor: float
    detector_class: str
    classifier_confidence: float
    bbox: list[float]


class ScrapMaterialCNN(nn.Module):
    def __init__(self, num_classes: int = len(SCRAP_CLASSES)) -> None:
        super().__init__()
        backbone = models.resnet18(weights=models.ResNet18_Weights.DEFAULT)
        in_features = backbone.fc.in_features
        backbone.fc = nn.Sequential(
            nn.Dropout(0.2),
            nn.Linear(in_features, num_classes),
        )
        self.network = backbone

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.network(x)


def train_yolo(
    data_yaml: str | Path,
    epochs: int = 50,
    imgsz: int = 640,
    batch: int = 16,
    project: str = "runs/scrapkart_yolo",
    device: str | int | None = None,
) -> YOLO:
    """
    Fine-tune a pre-trained YOLOv8 nano detector on a custom scrap dataset.

    Expected dataset structure:
    dataset/
      data.yaml
      images/train
      images/val
      labels/train
      labels/val
    """
    model = YOLO("yolov8n.pt")
    model.train(
        data=str(data_yaml),
        epochs=epochs,
        imgsz=imgsz,
        batch=batch,
        project=project,
        device=device,
        pretrained=True,
        patience=15,
        workers=4,
    )
    return model


def build_classification_dataloaders(
    dataset_root: str | Path,
    image_size: int = 224,
    batch_size: int = 32,
) -> tuple[DataLoader, DataLoader, dict[int, str]]:
    dataset_root = Path(dataset_root)
    train_dir = dataset_root / "train"
    val_dir = dataset_root / "val"

    train_transform = transforms.Compose(
        [
            transforms.Resize((image_size, image_size)),
            transforms.RandomHorizontalFlip(),
            transforms.ColorJitter(brightness=0.2, contrast=0.2, saturation=0.2),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
        ]
    )
    eval_transform = transforms.Compose(
        [
            transforms.Resize((image_size, image_size)),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
        ]
    )

    train_dataset = datasets.ImageFolder(train_dir, transform=train_transform)
    val_dataset = datasets.ImageFolder(val_dir, transform=eval_transform)

    train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True, num_workers=4, pin_memory=True)
    val_loader = DataLoader(val_dataset, batch_size=batch_size, shuffle=False, num_workers=4, pin_memory=True)

    index_to_class = {index: name for name, index in train_dataset.class_to_idx.items()}
    return train_loader, val_loader, index_to_class


def train_cnn_classifier(
    dataset_root: str | Path,
    epochs: int = 12,
    learning_rate: float = 1e-4,
    output_path: str | Path = "runs/scrapkart_cnn_best.pt",
    device: str | None = None,
) -> tuple[ScrapMaterialCNN, dict[int, str]]:
    device = device or ("cuda" if torch.cuda.is_available() else "cpu")
    train_loader, val_loader, index_to_class = build_classification_dataloaders(dataset_root)
    model = ScrapMaterialCNN(num_classes=len(index_to_class)).to(device)
    criterion = nn.CrossEntropyLoss()
    optimizer = AdamW(model.parameters(), lr=learning_rate)

    best_accuracy = 0.0
    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    for epoch in range(epochs):
        model.train()
        running_loss = 0.0
        running_correct = 0
        running_total = 0

        for images, labels in train_loader:
            images = images.to(device)
            labels = labels.to(device)

            optimizer.zero_grad()
            logits = model(images)
            loss = criterion(logits, labels)
            loss.backward()
            optimizer.step()

            running_loss += loss.item() * labels.size(0)
            running_correct += (logits.argmax(dim=1) == labels).sum().item()
            running_total += labels.size(0)

        train_loss = running_loss / max(running_total, 1)
        train_accuracy = running_correct / max(running_total, 1)

        model.eval()
        val_correct = 0
        val_total = 0
        with torch.no_grad():
            for images, labels in val_loader:
                images = images.to(device)
                labels = labels.to(device)
                logits = model(images)
                val_correct += (logits.argmax(dim=1) == labels).sum().item()
                val_total += labels.size(0)

        val_accuracy = val_correct / max(val_total, 1)
        print(
            f"Epoch {epoch + 1}/{epochs} | "
            f"train_loss={train_loss:.4f} | train_acc={train_accuracy:.3f} | val_acc={val_accuracy:.3f}"
        )

        if val_accuracy >= best_accuracy:
            best_accuracy = val_accuracy
            torch.save(
                {
                    "model_state_dict": model.state_dict(),
                    "index_to_class": index_to_class,
                    "image_size": 224,
                },
                output_path,
            )

    return model, index_to_class


def load_classifier(
    weights_path: str | Path,
    device: str | None = None,
) -> tuple[ScrapMaterialCNN, dict[int, str], transforms.Compose]:
    device = device or ("cuda" if torch.cuda.is_available() else "cpu")
    checkpoint = torch.load(weights_path, map_location=device)
    index_to_class = checkpoint["index_to_class"]
    image_size = checkpoint.get("image_size", 224)
    model = ScrapMaterialCNN(num_classes=len(index_to_class)).to(device)
    model.load_state_dict(checkpoint["model_state_dict"])
    model.eval()

    transform = transforms.Compose(
        [
            transforms.Resize((image_size, image_size)),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
        ]
    )
    return model, index_to_class, transform


def _crop_from_bbox(image: Image.Image, bbox: list[float]) -> Image.Image:
    x1, y1, x2, y2 = map(int, bbox)
    return image.crop((x1, y1, x2, y2))


def predict_scrap(
    image_path: str | Path,
    yolo_weights: str | Path = "runs/scrapkart_yolo/train/weights/best.pt",
    cnn_weights: str | Path = "runs/scrapkart_cnn_best.pt",
    device: str | None = None,
) -> ScrapPrediction:
    device = device or ("cuda" if torch.cuda.is_available() else "cpu")
    image_path = Path(image_path)
    detector = YOLO(str(yolo_weights))
    classifier, index_to_class, transform = load_classifier(cnn_weights, device=device)

    detection_result = detector.predict(source=str(image_path), conf=0.25, save=False, verbose=False)[0]
    if detection_result.boxes is None or len(detection_result.boxes) == 0:
        raise ValueError("No scrap object was detected in the image.")

    best_index = int(torch.argmax(detection_result.boxes.conf).item())
    best_confidence = float(detection_result.boxes.conf[best_index].item())
    best_bbox = detection_result.boxes.xyxy[best_index].tolist()
    detector_class = detector.names[int(detection_result.boxes.cls[best_index].item())]

    image = Image.open(image_path).convert("RGB")
    crop = _crop_from_bbox(image, best_bbox)
    tensor = transform(crop).unsqueeze(0).to(device)

    with torch.no_grad():
        logits = classifier(tensor)
        probabilities = torch.softmax(logits, dim=1)
        class_index = int(torch.argmax(probabilities, dim=1).item())
        classifier_confidence = float(probabilities[0, class_index].item())

    predicted_material = index_to_class[class_index]

    # Mock condition factor derived from detector confidence.
    condition_factor = max(0.1, min(1.0, round(best_confidence, 2)))

    return ScrapPrediction(
        material=predicted_material,
        confidence=round(best_confidence, 4),
        condition_factor=condition_factor,
        detector_class=str(detector_class),
        classifier_confidence=round(classifier_confidence, 4),
        bbox=[round(value, 2) for value in best_bbox],
    )


def export_models_to_onnx(
    yolo_weights: str | Path = "runs/scrapkart_yolo/train/weights/best.pt",
    cnn_weights: str | Path = "runs/scrapkart_cnn_best.pt",
    cnn_output_path: str | Path = "runs/scrapkart_cnn.onnx",
) -> None:
    """
    Export YOLO and CNN weights to ONNX for faster CPU inference.

    YOLO export uses the Ultralytics built-in exporter.
    CNN export uses torch.onnx.export with a dummy input tensor.
    """
    device = "cpu"

    # Export the detector:
    # This creates an ONNX file next to the trained YOLO weights.
    YOLO(str(yolo_weights)).export(format="onnx", imgsz=640, dynamic=True)

    # Export the classifier:
    classifier, _, _ = load_classifier(cnn_weights, device=device)
    dummy_input = torch.randn(1, 3, 224, 224, device=device)
    torch.onnx.export(
        classifier,
        dummy_input,
        str(cnn_output_path),
        input_names=["image"],
        output_names=["logits"],
        dynamic_axes={"image": {0: "batch"}, "logits": {0: "batch"}},
        opset_version=17,
    )


if __name__ == "__main__":
    # Example usage:
    # 1. Train detector:
    # train_yolo("datasets/scrap_detection/data.yaml", epochs=50)
    #
    # 2. Train classifier:
    # train_cnn_classifier("datasets/scrap_classification", epochs=12)
    #
    # 3. Run inference:
    # prediction = predict_scrap("sample.jpg")
    # print(prediction)
    pass
