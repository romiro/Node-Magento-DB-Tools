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

    ./app --start-server
    
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
    * ~~Download path in user's filesystem for SCP downloads of database dumps~~
    * Refactor config.js to use the json-store class instead
        * Save values directly to file when "save" is pressed on frontend

* Site Profile system
    * ~~Has own page for administration CRUD~~ ✔
    * Create and store profiles for client sites with the following data:
        * ~~Relevant SSH login credentials pulled from .ssh/config~~ ✔
        * ~~System path of production environment on SSH server~~ ✔
        * ~~Flag for whether or not to use private key or a stored password for authentication~~ ✔
            * ~~Automatically is set to private key when a .ssh/config entry is used~~ ✔
    * Store information gathered from SSH config file directly into the site profile to make data more portable
        
* DB Tool
    * ~~Add --skip-lock-tables and --single-transaction to dump command as to not lock tables~~
    * Running of DB sanitization commands through SSH
        * New page, using elements from data sanitization view ✔
            * ~~Option: Either full-dump mode or selectively using certain tables~~ ✔
            * ~~Option: Database table checkboxes for ignore-table params~~ ✔
            * ~~Option: Download file via scp from server after creation~~ ✔
        * Connect to SSH server using site profile
            * ~~Find local.xml using system path defined in system profile~~ ✔
            * ~~Extract DB information from &lt;resources> node of local.xml~~ ✔
            * ~~Use same JS functions as frontend page to create mysqldump commands~~ ✔
            * ~~Run mysqldump commands as defined with user request~~ ✔
            * If chosen, run scp command from local SSH to grab file from server into defined download directory
                * Also consider straight piping of data with connection instead of reliance on scp command ✔
                * SCP may be the final answer as some issues have developed with the straight piping method currently implemented
    * Connection Test
        * ~~Dry run of all of the above steps for the connection and running of mysqldump~~ ✔
            * ~~Currently "Test" and "Run" perform the same actions. Needs refactored that testing just performs tests.~~ ✔
    * Fixes / Changes
        * Store information gathered from SSH config file directly into the site profile to make data more portable

* Command Line Access
    * Refactor database dump module to emit events when complete instead of using resp.json to end request
    * Completely detatch web application aspect from the dump module
    * Implement CLI access through app.js (?), giving ability to run a site profile and perform same as the web app

* Local database import and making dev-ready
    * Import downloaded mysqldump file into local, temporary, database
    * After import, connect to local database server and temporary database
    * Run generic SQL statements against core_config_data which
        * Replaces the base URL of the site with the .dev version
            * New config values for "product domain" and "dev client code" needed
        * Replaces https with http in all %base_url% rows
        * Resets web/%secure/base_%_url to {{unsecure_base_url}}
        * Resets all web/cookie/cookie_domain to a blank value
        * Turns off GA
        * Turns off Auth.net
        * Turns on CC Save
        * Turns off JS and CSS merged files
        * Turns off admin password reset
        * Increases admin password lifetime to very high number
        * Removes admin custom URL
        * Refer to http://goo.gl/5RgKSp for spreadsheet with all SQL statements mentioned above
    * Have an option for additional custom, client-based SQL commands that should be run against the database
        * Template js file that contains object/class structure for creating custom script
        * Should be named <clientcode>.js and stored in a gitignored directory
        * After generic statements are complete, search for this file in the named directory.
            * If exists, require() file and run a generic method which initiates script file against already-connected DB
    * Export database again to another configured location (this will be where devs pick up the file for use - the means for this are TBD)

* Long Term Plans, New Features
    * PHP Info
        * Query a configured server for the output of php -i as run through CLI
        * Same as above but as webserver. Create temporary .php file with hash-like name that includes phpinfo(),

