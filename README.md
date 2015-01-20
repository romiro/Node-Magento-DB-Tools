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
* App should be fully functional all the way through, using the current HEAD of master branch (1/12/15)
* The tool available on the root page is fully functional and should be useful in assisting with remote database dumps


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

* Site Profile system
    * Currently undergoing massive overhaul into a 3 table sqlite data structure, separating Client, Server, and Profile concepts
        
* DB Tool
    * After site profile refactor, DB tool will need its data endpoints changed to match the refactoring
    * When DB tool finishes a dump and the download of the file, it should delete the file from the remote server

* Web Frontend
    * Client
        * Route function, related template file
        * Mapped list, add, delete to frontend display and js
    * Server
        * Route function, related template file
        * Mapped list, add, delete to frontend display and js
    * Profile
        * Route function, related template file
        * Mapped list, add, delete to frontend display and js
    * Core frontend JS
        * Super object to handle generic rendering of all three models

* Command Line Access
    * Phase 1 DONE!
    
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

