"use client";
import React from 'react';
import { RefreshCw } from 'lucide-react';

export default function RootPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0c] flex items-center justify-center">
      <RefreshCw className="w-8 h-8 text-primary animate-spin" />
    </div>
  );
}
