export const initWebGpu = async () => {

  if(!navigator.gpu) {
    throw new Error('WebGPU requires a navigator gpu');
  }

  const adapter = await navigator.gpu.requestAdapter();

  if(!adapter) {
    throw new Error('WebGPU requires a navigator gpu');
  }

  const device = await adapter.requestDevice();

  return {adapter, device};
}