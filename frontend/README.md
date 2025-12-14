# bun-react-tailwind-template

To install dependencies:

```bash
bun install
```

To start a development server:

```bash
bun dev
```

To run for production:

```bash
bun start
```

This project was created using `bun init` in bun v1.2.22. [Bun](https://bun.com) is a fast all-in-one JavaScript runtime.

Deployment notes:
- If you deploy to GitHub Pages under a repo subpath (e.g. `https://<user>.github.io/echo/`), ensure the app knows its basename.
- You can either add a `<base href="/echo/">` tag to `src/index.html` or rely on the app's GitHub Pages hostname detection which will automatically infer the repo segment.
