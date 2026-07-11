"use client";

import { GooeyToaster } from 'goey-toast';
import 'goey-toast/styles.css';

export function ClientGooeyToaster() {
  return (
    <GooeyToaster 
      position="bottom-right" 
      theme="dark" 
      maxQueue={3} 
      queueOverflow="drop-oldest"
    />
  );
}
