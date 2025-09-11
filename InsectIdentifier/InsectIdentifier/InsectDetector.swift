import Vision
import CoreML
import UIKit

class InsectDetector {
    private var classificationRequest: VNCoreMLRequest?
    private let commonUKInsects = [
        "Bumblebee",
        "Honey Bee",
        "Ladybird",
        "Butterfly",
        "Dragonfly",
        "Moth",
        "Wasp",
        "Ant",
        "Fly",
        "Mosquito"
    ]
    
    init() {
        setupVision()
    }
    
    private func setupVision() {
        guard let modelURL = Bundle.main.url(forResource: "InsectClassifier", withExtension: "mlmodelc") else {
            print("Failed to find the Core ML model in the bundle")
            return
        }
        
        do {
            let model = try MLModel(contentsOf: modelURL)
            let visionModel = try VNCoreMLModel(for: model)
            classificationRequest = VNCoreMLRequest(model: visionModel) { [weak self] request, error in
                if let error = error {
                    print("Vision ML request error: \(error)")
                    return
                }
                
                guard let results = request.results as? [VNClassificationObservation],
                      let topResult = results.first else {
                    return
                }
                
                // Process the results
                let insectName = topResult.identifier
                let confidence = Double(topResult.confidence)
                
                // Only consider it a detection if confidence is high enough
                if confidence > 0.7 {
                    DispatchQueue.main.async {
                        self?.lastDetection = (insectName, confidence)
                    }
                }
            }
            
            // Configure the request
            classificationRequest?.imageCropAndScaleOption = .scaleFit
            
        } catch {
            print("Failed to load Vision ML model: \(error)")
        }
    }
    
    private var lastDetection: (String, Double)?
    private var lastDetectionTime: Date = Date()
    private let detectionCooldown: TimeInterval = 1.0 // Minimum time between detections
    
    func detectInsect(in image: CVPixelBuffer, completion: @escaping (String?, Double?) -> Void) {
        guard let request = classificationRequest else {
            completion(nil, nil)
            return
        }
        
        // Check if we should return the last detection
        let now = Date()
        if let last = lastDetection, now.timeIntervalSince(lastDetectionTime) < detectionCooldown {
            completion(last.0, last.1)
            return
        }
        
        // Create a new image-request handler
        let handler = VNImageRequestHandler(cvPixelBuffer: image, orientation: .up)
        
        do {
            // Perform the classification request
            try handler.perform([request])
            
            // Update the last detection time
            lastDetectionTime = now
            
            // Return the last detection if available
            if let last = lastDetection {
                completion(last.0, last.1)
            } else {
                completion(nil, nil)
            }
        } catch {
            print("Failed to perform classification: \(error)")
            completion(nil, nil)
        }
    }
} 