Node-Magento-DB-Tools
=====================

node.js web application that assists with database dumping, santization, and more.


Getting Started
---------------

After cloning down, run 
    
    npm install
    
within the working directory to install the preqruisites.

Copy, rename, and modify config.js.sample to config.js and adjust values as needed (reminder that the mysql credentials are as they would be when connecting through the configured SSH connection)

After that, just

    node server.js
    
And browse to http://localhost:8800 (or whichever port you configured for your web server)


### Notes
* Currently the node server tunnel aspect doesn't have any communication with the web app, it's in proof of concept mode now
* The page that is served from the root of the server is currently a self-sufficient JS web app (ie, a web server isn't even required).
* The tool available on the page is fully functional and should be useful in assisting with remote database dumps
