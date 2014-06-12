Node-Magento-DB-Tools
=====================

node.js web application that assists with database dumping, santization, and more.


Getting Started
---------------

Requires an up-to-date installation of both node and npm (ie, not from default package managers)

After cloning down, run 
    
    npm install
    
within the working directory to install the preqruisites.

Copy, rename, and modify config.js.sample to config.js and adjust values as needed (reminder that the mysql credentials are as they would be when connecting through the configured SSH connection)

After that, just

    node app.js
    
And browse to http://localhost:8800 (or whichever port you configured for your web server)

Grunt is installed and there is a less and watch task in there, but the compiled css and map files are committed with each change.

To see utilize the .map file in your browser, run this from project root: cd public/css; ln -s ../../less


### Notes
* ~~Currently the node server tunnel aspect doesn't have any communication with the web app, it's in proof of concept mode now~~
* The tool available on the root page is fully functional and should be useful in assisting with remote database dumps
* The automatic dump aspect is currently in development. Do not expect it to work.


### TODO
* DB Tool
    * Add --skip-lock-tables and --single-transaction to dump command as to not lock tables

* Configuration Options
    * Download path in user's filesystem for SCP downloads of database dumps

* Site Profile system
    * Has own page for administration CRUD ✔
    * Create and store profiles for client sites with the following data:
        * Relevant SSH login credentials pulled from .ssh/config ✔
        * System path of production environment on SSH server ✔
        
* Running of DB sanitization commands through SSH
    * New page, using elements from data sanitization view ✔
        * Option: Either full-dump mode or selectively using certain tables ✔
        * Option: Database table checkboxes for ignore-table params ✔
        * Option: Download file via scp from server after creation

    * Connect to SSH server using site profile
        * Find local.xml using system path defined in system profile ✔
        * Extract DB information from &lt;resources> node of local.xml ✔
        * Use same JS functions as frontend page to create mysqldump commands ✔
        * Run mysqldump commands as defined with user request
        * If chosen, run scp command from local SSH to grab file from server into defined download directory

    * Connection Test
        * Dry run of all of the above steps for the connection and running on mysqldump

* MySQL command generator (existing, currently called "Home")
    * Add ability to use existing site profile to get the contents of a local.xml