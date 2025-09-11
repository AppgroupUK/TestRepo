import CreateML
import CoreML
import Foundation

// Create ML training script
let trainingData = try MLImageClassifier.DataSource.labeledDirectories(at: URL(fileURLWithPath: "InsectDataset"))

let parameters = MLImageClassifier.ModelParameters(
    validation: .split(strategy: .automatic),
    maxIterations: 20,
    augmentationOptions: [
        .horizontalFlip,
        .verticalFlip,
        .rotate,
        .crop,
        .exposure,
        .brightness
    ]
)

let model = try MLImageClassifier(trainingData: trainingData, parameters: parameters)

// Evaluate the model
let evaluation = model.evaluation(on: trainingData)
print("Training accuracy: \(evaluation.classificationError)")

// Save the model
try model.write(to: URL(fileURLWithPath: "InsectClassifier.mlmodel")) 