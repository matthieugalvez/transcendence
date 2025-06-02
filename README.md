You need to update NODE on your session before running:

```
# Download and install nvm:
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash

# in lieu of restarting the shell
\. "$HOME/.nvm/nvm.sh"

# Download and install Node.js:
nvm install 22

# Verify the Node.js version:
node -v # Should print "v22.16.0".
nvm current # Should print "v22.16.0".

# Verify npm version:
npm -v # Should print "10.9.2".
```

Then run
```
npm install
npm run build
npm run dev
```

site will be accessible on localhost:5173

(Vite is used for fast dev environment, we can not use it for the backend though as per discord #staff-pedagogy).

The current project setup is just a basic setup to run the frontend independently using vite as a bundler (no framework).