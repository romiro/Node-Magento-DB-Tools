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


### Description
* DB Tool
    * Copy a piece of a local.xml file containing the db connection information and generate commands to dump that database
    * Also convenient for simply connecting to mysql client via CLI

* Site Profiles
    * Individual records for each site to be used for automatic DB pull
    * Can use ~/.ssh/config data to define server and username
    * Profile can be tested on DB Pull interface

* Database Pull
    * Use a configured site profile to connect through SSH and download database


### TODO
* MySQL command generator (existing, currently called "Home")
    * Add ability to use existing site profile to get the contents of a local.xml

* Configuration Options
    * Download path in user's filesystem for SCP downloads of database dumps

* Site Profile system
    * Has own page for administration CRUD ✔
    * Create and store profiles for client sites with the following data:
        * Relevant SSH login credentials pulled from .ssh/config ✔
        * System path of production environment on SSH server ✔
        * Flag for whether or not to use private key or a stored password for authentication
            * Automatically is set to private key when a .ssh/config entry is used
    * Store information gathered from SSH config file directly into the site profile to make data more portable
        
* DB Tool
    * Add --skip-lock-tables and --single-transaction to dump command as to not lock tables
    * Running of DB sanitization commands through SSH
        * New page, using elements from data sanitization view ✔
            * Option: Either full-dump mode or selectively using certain tables ✔
            * Option: Database table checkboxes for ignore-table params ✔
            * Option: Download file via scp from server after creation
        * Connect to SSH server using site profile
            * Find local.xml using system path defined in system profile ✔
            * Extract DB information from &lt;resources> node of local.xml ✔
            * Use same JS functions as frontend page to create mysqldump commands ✔
            * Run mysqldump commands as defined with user request ✔
            * If chosen, run scp command from local SSH to grab file from server into defined download directory
                * Also consider straight piping of data with connection instead of reliance on scp command
    * Connection Test
        * Dry run of all of the above steps for the connection and running of mysqldump
    * Fixes / Changes
        * Store information gathered from SSH config file directly into the site profile to make data more portable

* Command Line Access
    * Refactor database dump module to emit events when complete instead of using resp.json to end request
    * Completely detatch web application aspect from the dump module
    * Implement CLI access through app.js (?), giving ability to run a site profile and perform same as the web app

