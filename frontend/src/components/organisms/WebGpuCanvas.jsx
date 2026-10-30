import {useEffect, useRef} from "react";
import {initWebGpu} from "@/lib/webgpu/initWebGpu.js";

// The cell's two triangles; constant, so built once rather than on every render.
const vertices = new Float32Array([
//   X,    Y,
  -0.8, -0.8, // Triangle 1 (Blue)
  0.8, -0.8,
  0.8,  0.8,

  -0.8, -0.8, // Triangle 2 (Red)
  0.8,  0.8,
  -0.8,  0.8,
]);

export const WebGpuCanvas = () => {

  const canvasRef = useRef(null);


  const GRID_SIZE = 16;

  useEffect(() => {
    async function init() {

      const canvas = canvasRef.current;
      const context = canvas.getContext("webgpu");

      const { device} = await initWebGpu();

      const canvasFormat = navigator.gpu.getPreferredCanvasFormat();

      context.configure({
        device,
        format: canvasFormat,
      });

      const vertexBuffer = device.createBuffer({
        label: "Cell vertices",
        size: vertices.byteLength,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
      });

      device.queue.writeBuffer(vertexBuffer, /*bufferOffset=*/0, vertices);

      // Create a uniform buffer that describes the grid.
      const uniformArray = new Float32Array([GRID_SIZE, GRID_SIZE]);
      const uniformBuffer = device.createBuffer({
        label: "Grid Uniforms",
        size: uniformArray.byteLength,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
      });
      device.queue.writeBuffer(uniformBuffer, 0, uniformArray);

      const vertexBufferLayout = {
        arrayStride: 8,
        attributes: [{
          format: "float32x2",
          offset: 0,
          shaderLocation: 0, // Position, see vertex shader
        }],
      };

      const cellShaderModule = device.createShaderModule({
        label: 'Cell shader',
        code: `
            @group(0) @binding(0) var<uniform> grid: vec2f;
            
            @vertex
            fn vertexMain(@location(0) pos: vec2f,
                          @builtin(instance_index) instance: u32) ->
              @builtin(position) vec4f {
            
              let i = f32(instance);
              // Compute the cell coordinate from the instance_index
              let cell = vec2f(i % grid.x, floor(i / grid.x));
            
              let cellOffset = cell / grid * 2;
              let gridPos = (pos + 1) / grid - 1 + cellOffset;
            
              return vec4f(gridPos, 0, 1);
            }
        
            @fragment
            fn fragmentMain() -> @location(0) vec4f {
              return vec4f(1, 1, 1, 1);
            }
          `
      });

      const cellPipeline = device.createRenderPipeline({
        label: "Cell pipeline",
        layout: "auto",
        vertex: {
          module: cellShaderModule,
          entryPoint: "vertexMain",
          buffers: [vertexBufferLayout]
        },
        fragment: {
          module: cellShaderModule,
          entryPoint: "fragmentMain",
          targets: [{
            format: canvasFormat
          }]
        }
      });

      const bindGroup = device.createBindGroup({
        label: "Cell renderer bind group",
        layout: cellPipeline.getBindGroupLayout(0),
        entries: [{
          binding: 0,
          resource: { buffer: uniformBuffer }
        }],
      });

      const encoder = device.createCommandEncoder();

      const pass = encoder.beginRenderPass({
        colorAttachments: [{
          view: context.getCurrentTexture().createView(),
          loadOp: "clear",
          clearValue: { r: 0.5, g: 0.5, b: 0.5, a: 1 },
          storeOp: "store",
        }],
      });

      pass.setPipeline(cellPipeline);
      pass.setVertexBuffer(0, vertexBuffer);

      pass.setBindGroup(0, bindGroup);

      pass.draw(vertices.length / 2, GRID_SIZE * GRID_SIZE);
      pass.end();

      device.queue.submit([encoder.finish()]);

    }


    init().then().catch((err) => {
      console.error(err);
    });
  }, []);


  return (
    <canvas ref={canvasRef}
            className="block h-auto w-full max-w-125 aspect-square"
            width={500}
            height={500}
    />
  )
}
