// @refresh reload
import { Suspense } from "solid-js";
import {
  A,
  Body,
  ErrorBoundary,
  FileRoutes,
  Head,
  Html,
  Meta,
  Routes,
  Scripts,
  Title,
} from "solid-start";
import "./root.css";
import 'virtual:uno.css';

export default function Root() {
  return (
    <Html lang="en">
      <Head>
        <Title>SolidStart - Bare</Title>
        <Meta charset="utf-8" />
        <Meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <Body>
        <Suspense>
          <ErrorBoundary>
            <div class="flex justify-center">
              <div class="flex">
                <A class="bg-blue-700 text-white px-10 py-4 mr-0 shadow-xl" href="https://rotko.net/">Home</A>
                <A class="bg-blue-700 text-white px-10 py-4 mx-0 shadow-xl" href="/">Monitor</A>
                <A class="bg-blue-700 text-white px-10 py-4 mx-0 shadow-xl" href="https://rotko.net/docs">Docs</A>
              </div>
            </div>
            <Routes>
              <FileRoutes/>
            </Routes>
          </ErrorBoundary>
        </Suspense>
        <Scripts />
      </Body>
    </Html>
  );
}
