export async function healthLogic({ res }) {
  return {
    status: 'ok',
    message: 'Server is running smoothly!',
  };
}
