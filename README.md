Node-Magento-DB-Tools
=====================

node.js web application that assists with database dumping, santization, and more.

Requirements
---------------
* Linux (tested) or Mac (untested), will not work in Windows
* scp
* node v0.12.0 (developed on this version, using other versions may break application)


Getting Started
---------------

Requires an up-to-date installation of both node and npm (ie, not from default package managers)

After cloning down, run 
    
    npm install
    
within the working directory to install the prerequisites.

Copy, rename, and modify config.js.sample to config.js and adjust values as needed

After that, you need to setup the Sqlite database. This can be accomplished with:

    ./app --setup-db
    
And after that, start the web server:

    ./app --start-server
    
And browse to http://localhost:8800 (or whichever port you configured for your web server)

### Site Profiles
The site profile system is separated into three entities: client, server, and profile. You have to create one of each to have a fully functional database dump action.

Once a profile is set up with a related server and client, you can click the "Run" button the profile page to bring up the buttons which start the action.
 
Keep an eye on your console to see the status of the database dump. Maybe one day socket.io will just output these messages directly to the browser.

### Command-line access
There are a few CLI options that are available, you can see a list by just running ./app without any options

      Usage: app [options]
    
      Options:
    
        -h, --help                   output usage information
        -V, --version                output the version number
        --start-server               Start web server using options defined in config.js
           --port [port]             Used with --start-server, port that web server will listen on. Defaults to config.js value
                                     
        --list-profiles              List configured site profiles
        --show-profile [profile id]  Show information stored for a given profile name
          --full                     Used with --show-profile to show extended information
                                     
        --run-profile [profile id]   Run given profile, defaulting to full dump
           --selective-dump          Optional, used with --run-profile, performs a selective table dump excluding tables in lib/storage/excluded-tables.json
        --test-profile [profile id]  Test run for given profile
                                     
        --setup-db                   Run the scripts to initialize the Sqlite3 database


### Development
Grunt is installed and there is a less and watch task in there, but the compiled css and map files are committed with each change.

To see utilize the .map file in your browser, run this from project root: cd public/css; ln -s ../../less


### Notes
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
    * ~~Currently undergoing massive overhaul into a 3 table sqlite data structure, separating Client, Server, and Profile concepts~~
        
* DB Tool
    * ~~After site profile refactor, DB tool will need its data endpoints changed to match the refactoring~~
    * When DB tool finishes a dump and the download of the file, it should delete the file from the remote server
    * Possibly need to refactor local file download to read piece by piece and write file to local machine rather than storing the entire thing into memory, as node has some hardcoded memory limits that some DB dumps would definitely surpass

* Web Frontend
    * Phase 1 DONE!

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

* Misc
    * ~~Logging to file - both webserver hits and the output of a profile run~~
    * Socket.io re-integration to output the messages during the dump directly to the web browser
     
* Long Term Plans, New Features
    * PHP Info
        * Query a configured server for the output of php -i as run through CLI
        * Same as above but as webserver. Create temporary .php file with hash-like name that includes phpinfo(),

