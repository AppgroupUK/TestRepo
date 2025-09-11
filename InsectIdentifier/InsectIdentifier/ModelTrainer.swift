import Foundation
import CoreML
import CreateMLComponents

class ModelTrainer {
    static func trainModel() {
        do {
            // Get the path to the InsectDataset directory in the project
            let projectPath = FileManager.default.currentDirectoryPath
            let datasetPath = projectPath + "/InsectDataset"
            let datasetURL = URL(fileURLWithPath: datasetPath)
            
            print("Looking for dataset at: \(datasetPath)")
            
            // Verify the dataset exists
            guard FileManager.default.fileExists(atPath: datasetPath) else {
                print("Error: Dataset not found at \(datasetPath)")
                return
            }
            
            // Create ML training script
            let trainingData = try MLImageClassifier.DataSource.labeledDirectories(at: datasetURL)
            
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
            
            print("Starting model training...")
            let model = try MLImageClassifier(trainingData: trainingData, parameters: parameters)
            
            // Evaluate the model
            let evaluation = model.evaluation(on: trainingData)
            print("Training accuracy: \(evaluation.classificationError)")
            
            // Save the model
            let modelURL = try FileManager.default.url(
                for: .documentDirectory,
                in: .userDomainMask,
                appropriateFor: nil,
                create: true
            ).appendingPathComponent("InsectClassifier.mlmodel")
            
            try model.write(to: modelURL)
            print("Model saved to: \(modelURL.path)")
            
        } catch {
            print("Error training model: \(error)")
        }
    }
} 
