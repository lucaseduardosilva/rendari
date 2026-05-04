import { ButtonHTMLAttributes, ReactNode } from 'react';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  loadingText?: string;
  variant?: 'primary' | 'secondary' | 'ghost';
  children: ReactNode;
}

/**
 * Botão padronizado com estado de loading.
 * - Mostra spinner + texto alternativo durante loading
 * - Desabilita-se sozinho quando loading
 */
export default function SubmitButton({ loading, loadingText, variant = 'primary', children, disabled, style, ...rest }: Props) {
  return (
    <button
      {...rest}
      className={variant}
      disabled={loading || disabled}
      style={{ ...style, position: 'relative' }}
    >
      {loading && (
        <span style={{
          width: 14, height: 14, border: '2px solid currentColor', borderRightColor: 'transparent',
          borderRadius: '50%', display: 'inline-block', animation: 'spin .7s linear infinite', marginRight: 6,
        }} />
      )}
      {loading ? (loadingText || 'Salvando…') : children}
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </button>
  );
}
