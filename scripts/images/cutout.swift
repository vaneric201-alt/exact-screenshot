// Lift the main subject out of a photo with Apple's Vision framework (on-device),
// writing a PNG with a transparent background and printing the subject's share
// of the frame. Usage: swift cutout.swift in.jpg out.png
import Foundation
import Vision
import CoreImage
import AppKit

let args = CommandLine.arguments
guard args.count == 3 else { print("usage: cutout in out"); exit(2) }
let input = URL(fileURLWithPath: args[1])
let output = URL(fileURLWithPath: args[2])
guard let ci = CIImage(contentsOf: input) else { print("ERR read"); exit(1) }
let handler = VNImageRequestHandler(ciImage: ci)
let req = VNGenerateForegroundInstanceMaskRequest()
do { try handler.perform([req]) } catch { print("ERR vision \(error)"); exit(1) }
guard let obs = req.results?.first, !obs.allInstances.isEmpty else { print("NONE"); exit(0) }
do {
  let mask = try obs.generateScaledMaskForImage(forInstances: obs.allInstances, from: handler)
  let masked = try obs.generateMaskedImage(ofInstances: obs.allInstances, from: handler, croppedToInstancesExtent: true)
  // share of the frame covered by the subject
  let m = CIImage(cvPixelBuffer: mask)
  let ctx = CIContext()
  let avg = CIFilter(name: "CIAreaAverage", parameters: [kCIInputImageKey: m, kCIInputExtentKey: CIVector(cgRect: m.extent)])!.outputImage!
  var px = [Float](repeating: 0, count: 4)
  ctx.render(avg, toBitmap: &px, rowBytes: 16, bounds: CGRect(x: 0, y: 0, width: 1, height: 1), format: .RGBAf, colorSpace: nil)
  let out = CIImage(cvPixelBuffer: masked)
  try ctx.writePNGRepresentation(of: out, to: output, format: .RGBA8, colorSpace: CGColorSpace(name: CGColorSpace.sRGB)!)
  print(String(format: "OK %.3f %d %d %d", px[0], obs.allInstances.count, Int(out.extent.width), Int(out.extent.height)))
} catch { print("ERR mask \(error)"); exit(1) }
