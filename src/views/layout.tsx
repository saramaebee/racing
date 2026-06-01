import { raw } from 'hono/html';
import type { PropsWithChildren } from 'hono/jsx';
import { STYLES } from './styles';

interface LayoutProps {
  title: string;
  isEditor: boolean;
}

export function Layout({ title, isEditor, children }: PropsWithChildren<LayoutProps>) {
  return (
    <>
      {raw('<!DOCTYPE html>')}
      <html lang="en">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>{title}</title>
          <style>{raw(STYLES)}</style>
        </head>
        <body>
          <header class="topbar">
            <div class="topbar-inner">
              <a class="brand" href="/">
                <span class="brand-mark">🏁</span>
                <span>Racing</span>
              </a>
              <div class="topbar-spacer" />
              {isEditor ? (
                <>
                  <span class="user-chip editing">● Editing</span>
                  <form method="post" action="/logout" class="inline">
                    <button class="ghost" type="submit">
                      Log out
                    </button>
                  </form>
                </>
              ) : (
                <a class="user-chip" href="/login">
                  View only · Log in to edit
                </a>
              )}
            </div>
          </header>
          <main>{children}</main>
        </body>
      </html>
    </>
  );
}
