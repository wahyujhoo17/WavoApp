import { gooeyToast } from 'goey-toast';

export type ToastType = 'success' | 'error' | 'info';

export const toast = {
  show: (title: string, message: string, type: ToastType = 'success') => {
    switch (type) {
      case 'success':
        gooeyToast.success(title, { description: message });
        break;
      case 'error':
        gooeyToast.error(title, { description: message });
        break;
      case 'info':
        gooeyToast.info(title, { description: message });
        break;
    }
  },
  success: (title: string, message: string) => {
    gooeyToast.success(title, { description: message });
  },
  error: (title: string, message: string) => {
    gooeyToast.error(title, { description: message });
  },
  info: (title: string, message: string) => {
    gooeyToast.info(title, { description: message });
  }
};
