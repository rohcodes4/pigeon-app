// historyStore.ts
type HistoryFlagStore = {
    [chatId: string]: boolean;
  };
  
  const chatHistoryFlags: HistoryFlagStore = {};
  
  export const setHistoryFetched = (chatId: string) => {
    chatHistoryFlags[chatId] = true;
  };
  
  export const isHistoryFetched = (chatId: string) => {
    return !!chatHistoryFlags[chatId];
  };
  
  export const resetHistoryFlags = () => {
    Object.keys(chatHistoryFlags).forEach(key => delete chatHistoryFlags[key]);
  };
  