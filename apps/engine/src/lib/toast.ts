export type ToastType = 'success' | 'error' | 'info';

export const toast = {
  show: (title: string, message: string, type: ToastType = 'success') => {
    window.dispatchEvent(new CustomEvent('show-toast', { 
      detail: { title, message, type } 
    }));
  },
  success: (title: string, message: string) => {
    toast.show(title, message, 'success');
  },
  error: (title: string, message: string) => {
    toast.show(title, message, 'error');
  },
  info: (title: string, message: string) => {
    toast.show(title, message, 'info');
  }
};
