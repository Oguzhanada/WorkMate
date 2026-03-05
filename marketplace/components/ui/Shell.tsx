import { ReactNode } from 'react';

type ShellProps = {
  header: ReactNode;
  children: ReactNode;
};

export default function Shell({ header, children }: ShellProps) {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 pb-14 pt-5 sm:px-6 lg:px-8">
      <section>{header}</section>
      <section className="mt-6">{children}</section>
    </main>
  );
}
