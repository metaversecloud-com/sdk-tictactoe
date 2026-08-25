export const lockDataObject = async (lockId, recordToLock) => {
  await recordToLock.updateDataObject({}, { lock: { lockId, releaseLock: false } });
};
