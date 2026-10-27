module.exports = {
  apps: [
    {
      name: "scanlead-edge",
      cwd: "/home/ubuntu/apps/scanlead/web",
      script: "scripts/scanlead-edge.js",
      interpreter: "node",
      env: {
        NODE_ENV: "production",
        EDGE_PORT: "3010",
        UPSTREAM_HOST: "127.0.0.1",
        UPSTREAM_PORT: "3011",
      },
      max_memory_restart: "80M",
      error_file: "/home/ubuntu/apps/scanlead/logs/edge.err.log",
      out_file: "/home/ubuntu/apps/scanlead/logs/edge.out.log",
    },
    {
      name: "scanlead-web",
      cwd: "/home/ubuntu/apps/scanlead/web",
      script: "server.js",
      interpreter: "node",
      env: {
        NODE_ENV: "production",
        PORT: "3011",
        HOSTNAME: "127.0.0.1",
        API_URL: "http://127.0.0.1:8000",
        NODE_OPTIONS: "--max-old-space-size=256",
      },
      max_memory_restart: "280M",
      error_file: "/home/ubuntu/apps/scanlead/logs/web.err.log",
      out_file: "/home/ubuntu/apps/scanlead/logs/web.out.log",
    },
  ],
};
