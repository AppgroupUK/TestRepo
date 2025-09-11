//
//  ContentView.swift
//  InsectIdentifier
//
//  Created by Luke Smith on 21/05/2025.
//

import SwiftUI
import AVFoundation
import Vision
import CoreML

struct ContentView: View {
    @StateObject private var cameraManager = CameraManager()
    @State private var isTraining = false
    @State private var trainingProgress: String = ""
    
    var body: some View {
        ZStack {
            // Camera preview
            CameraPreviewView(session: cameraManager.session)
                .edgesIgnoringSafeArea(.all)
            
            VStack {
                Spacer()
                
                // Training button
                Button(action: {
                    isTraining = true
                    trainingProgress = "Starting model training..."
                    DispatchQueue.global(qos: .userInitiated).async {
                        ModelTrainer.trainModel()
                        DispatchQueue.main.async {
                            isTraining = false
                            trainingProgress = "Training complete!"
                        }
                    }
                }) {
                    Text("Train Model")
                        .font(.headline)
                        .foregroundColor(.white)
                        .padding()
                        .background(Color.blue)
                        .cornerRadius(10)
                }
                .disabled(isTraining)
                .padding(.bottom, 20)
                
                if isTraining {
                    Text(trainingProgress)
                        .foregroundColor(.white)
                        .padding()
                        .background(Color.black.opacity(0.7))
                        .cornerRadius(10)
                }
            }
        }
        .onAppear {
            cameraManager.checkPermissions()
        }
    }
}

class CameraManager: ObservableObject {
    let session = AVCaptureSession()
    private var videoOutput = AVCaptureVideoDataOutput()
    private let insectDetector = InsectDetector()
    @Published var detectedInsect: String?
    @Published var confidence: Double?
    
    func checkPermissions() {
        switch AVCaptureDevice.authorizationStatus(for: .video) {
        case .authorized:
            setupCamera()
        case .notDetermined:
            AVCaptureDevice.requestAccess(for: .video) { [weak self] granted in
                if granted {
                    DispatchQueue.main.async {
                        self?.setupCamera()
                    }
                }
            }
        default:
            break
        }
    }
    
    private func setupCamera() {
        guard let device = AVCaptureDevice.default(.builtInWideAngleCamera, for: .video, position: .back) else { return }
        
        do {
            let input = try AVCaptureDeviceInput(device: device)
            if session.canAddInput(input) {
                session.addInput(input)
            }
            
            videoOutput.setSampleBufferDelegate(self, queue: DispatchQueue(label: "videoQueue"))
            if session.canAddOutput(videoOutput) {
                session.addOutput(videoOutput)
            }
            
            DispatchQueue.global(qos: .background).async { [weak self] in
                self?.session.startRunning()
            }
        } catch {
            print("Error setting up camera: \(error.localizedDescription)")
        }
    }
}

extension CameraManager: AVCaptureVideoDataOutputSampleBufferDelegate {
    func captureOutput(_ output: AVCaptureOutput, didOutput sampleBuffer: CMSampleBuffer, from connection: AVCaptureConnection) {
        guard let pixelBuffer = CMSampleBufferGetImageBuffer(sampleBuffer) else { return }
        
        insectDetector.detectInsect(in: pixelBuffer) { [weak self] insect, confidence in
            DispatchQueue.main.async {
                self?.detectedInsect = insect
                self?.confidence = confidence
            }
        }
    }
}

struct CameraPreviewView: UIViewRepresentable {
    let session: AVCaptureSession
    
    func makeUIView(context: Context) -> UIView {
        let view = UIView(frame: UIScreen.main.bounds)
        let previewLayer = AVCaptureVideoPreviewLayer(session: session)
        previewLayer.frame = view.frame
        previewLayer.videoGravity = .resizeAspectFill
        view.layer.addSublayer(previewLayer)
        return view
    }
    
    func updateUIView(_ uiView: UIView, context: Context) {}
}

#Preview {
    ContentView()
}
