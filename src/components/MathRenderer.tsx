'use client';

import React, { useMemo } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

interface MathRendererProps {
  content: string;
  className?: string;
}

export const MathRenderer: React.FC<MathRendererProps> = ({ content, className = '' }) => {
  const renderedContent = useMemo(() => {
    if (!content) return '';

    // Substitui blocos de matemática inline $...$ e display $$...$$
    let formatted = content;

    // Display math $$...$$
    formatted = formatted.replace(/\$\$([\s\S]*?)\$\$/g, (_, math) => {
      try {
        return `<div class="my-2 p-2 bg-surface-100 dark:bg-surface-800/60 rounded overflow-x-auto text-center">${katex.renderToString(math.trim(), { displayMode: true, throwOnError: false })}</div>`;
      } catch (e) {
        return math;
      }
    });

    // Inline math $...$
    formatted = formatted.replace(/\$([^\$\n]+?)\$/g, (_, math) => {
      try {
        return katex.renderToString(math.trim(), { displayMode: false, throwOnError: false });
      } catch (e) {
        return math;
      }
    });

    // Markdown básico para negrito e itálico
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');
    formatted = formatted.replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 rounded bg-surface-200 dark:bg-surface-800 font-mono text-xs text-primary-600 dark:text-primary-400 font-semibold">$1</code>');

    return formatted;
  }, [content]);

  return (
    <div
      className={`leading-relaxed text-surface-800 dark:text-surface-200 ${className}`}
      dangerouslySetInnerHTML={{ __html: renderedContent }}
    />
  );
};
