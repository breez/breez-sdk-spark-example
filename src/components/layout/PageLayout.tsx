import React, { ReactNode } from 'react';

interface PageLayoutProps {
  children: ReactNode;
  footer: ReactNode
  onBack: () => void | null;
  title?: string;
  showHeader?: boolean;
  onClearError?: () => void;
}

const PageLayout: React.FC<PageLayoutProps> = ({
  children,
  title,
  footer,
  onBack = null,
  showHeader = true,
}) => {
  return (
    <div className="h-[calc(100dvh)] w-full flex flex-col bg-[var(--card-bg)]">
      {showHeader && (
        <header className="p-4 shadow-md relative">
          <div className="container mx-auto">
            <h1 className="text-center text-xl font-bold text-[rgb(var(--text-white))]">
              {title || "Breez Wallet"}
            </h1>
          </div>
          {onBack && (
            <button onClick={onBack} className="text-xl absolute top-4 left-4">{"<-"}</button>
          )}
        </header>
      )}

      <main className="flex items-center flex-col w-full mx-auto flex-grow overflow-hidden bg-[var(--card-bg)]">
        <div className="flex-1">
          {children}
        </div>
        <div className="flex-0 flex">
          {footer}
        </div>
      </main>
    </div>
  );
};

export default PageLayout;
