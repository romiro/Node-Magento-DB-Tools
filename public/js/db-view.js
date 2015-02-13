var DatabaseViewAbstract = Object.subClass({
    init: function(){},

    getData: function(callback) {
        var self = this;
        $.ajax({
            url: Tools.format('/%s/getAll', this.pluralName),
            dataType: 'json',
            success: function(data){
                self.data = data;
                callback(data);
            }
        });
    },

    getDataFrom: function(type, callback) {
        var self = this;
        type = Tools.capitalize(type);
        $.ajax({
            url: Tools.format('/%s/getAll', type),
            dataType: 'json',
            success: function(data){
                callback(data);
            }
        });
    },

    getOneFrom: function(type, id, callback) {
        var self = this;
        type = Tools.capitalize(type);
        $.ajax({
            url: Tools.format('/%s/get', type),
            dataType: 'json',
            success: function(data){
                self.data = data;
                callback(data);
            }
        });
    },

    setupEvents: function(){},
    createAddBlock: function(){},

    beforeRender: function(){},
    render: function(){},
    finish: function(){
        this.beforeRender();
        this.render();
        this.setupEvents();
    }
});

var DatabaseView = DatabaseViewAbstract.subClass({

    init: function() {
        this.$template = $('#template').children().first().clone();
        this.$container = $('.database-view');
        this.data = null;
        this.singularName = '';
        this.pluralName = '';
    },

    setupEvents: function() {
        var self = this;

        //Save button
        this.$container.on('click', '.save-button', function(event){
            var $inputContainer = $(event.target).parents('.panel-primary');
            var $inputs = $inputContainer.find(':input').not(':button');
            if (!Tools.validate($inputs, self.$container)) {
                return false;
            }
            $.ajax({
                url: Tools.format('/%s/save', self.pluralName),
                type: 'POST',
                data: $inputs.serialize(),
                success: function() {
                    document.location = document.location;
                }
            });
        });

        //Delete button
        this.$container.on('click', '.delete-button', function(event){
            var $inputContainer = $(event.target).parents('.panel-primary');
            var name = $inputContainer.find('input.name').val();
            if (!window.confirm(Tools.format('Do you wish to delete %s "%s"?', self.singularName, name))) {
                return false;
            }
            var id = $inputContainer.find(':input[name=id]').val();

            $.ajax({
                url: Tools.format('/%s/delete', self.pluralName),
                type: 'POST',
                data: {id: id},
                success: function() {
                    document.location = document.location;
                }
            });
        });

        this.$container.on('click', '.edit .panel-heading', function(event){
            var $panelBody = $(this).siblings('.panel-body');
            var slideDuration = 200;
            $panelBody.toggleClass('show-panel');
            if ($panelBody.hasClass('show-panel')) {
                $panelBody.slideDown(slideDuration);
            }
            else {
                $panelBody.slideUp(slideDuration);
            }

        });
    },

    render: function() {
        var self = this;
        $.each(this.data, function(i, record){
            var $record = self.$template.clone().addClass('edit panel-primary');
            $.each(record, function(key, val){
                $record.find(Tools.format(':input[name=%s]', key)).val(val);
            });

            $record.prepend($('<div class="panel-heading"></div>').text(record[self.singularName.toLowerCase() + '_name']));

            //Save button
            $record.find('.panel-body').append('<div class="buttons"><button type="button" class="save-button btn btn-primary">Save</button></div>');

            //Delete button
            $record.find('.panel-body').append('<div class="buttons"><button type="button" class="delete-button btn btn-xs btn-danger">Delete</button></div>');

            self.$container.append($record);
        });

    },

    createAddBlock: function() {
        var $addBlock = this.$template.clone().addClass('add panel-success');
        $addBlock.prepend(Tools.format('<div class="panel-heading">New %s</div>', this.singularName));
        $addBlock.find('.panel-body').append($('<div class="buttons"><button type="button" class="save-button btn btn-success">Add</button></div>'));
        this.$container.prepend($addBlock);
    },

    finish: function() {
        this.beforeRender();
        this.createAddBlock();
        this.render();
        this.setupEvents();
    }
});


var Clients = DatabaseView.subClass({
    init: function() {
        this._super();

        this.singularName = 'Client';
        this.pluralName = 'Clients';

        var self = this;
        this.getData(function(data){
            self.finish();
        });
    }
});



var Servers = DatabaseView.subClass({
    init: function() {
        this._super();

        this.singularName = 'Server';
        this.pluralName = 'Servers';
        var self = this;

        this.getData(function(data){
            self.getDataFrom('clients', function(data){
                self.clientData = data;
                self.getDataFrom('SshConfig', function(data){
                    self.sshConfigData = data;
                    self.finish();
                });
            });
        });
    },

    beforeRender: function() {
        var self = this;
        //Render select boxes for Client data
        this.$template.find('.panel-body select.client_id').each(function(i){
            var $select = $(this);
            $.each(self.clientData, function(i, v){
                $select.append(Tools.format('<option value="%s">%s</option>', v['id'], v['client_name']));
            });
        });
        this._super();
    },

    render: function() {
        var self = this;
        this._super();

        //Change headings to include client name
        this.$container.find('.panel.edit .panel-heading').each(function(i){
            $(this).text(self.data[i].client_name + " - " + $(this).text());
        });


        //Render select box for SSH Config data for the "New" panel only
        var $newPanel = this.$container.find('.panel.add .panel-body');
        $newPanel.find('.form-group.ssh_host, .form-group.ssh_username').remove();
        var $sshContainer = $newPanel.find('.form-group').first().clone().empty();
        $sshContainer.append('<label for="ssh_config">SSH Config Setting</label>');
        var $sshSelect = $('<select name="ssh_config" class="form-control ssh_config"></select>').appendTo($sshContainer);
        $.each(this.sshConfigData, function(i, val){
            $sshSelect.append(Tools.format('<option value="%s">%s</option>', val['label'], val['label']));
        });
        $sshContainer.insertBefore($newPanel.find('div.buttons'));

    }
});



var Profiles = DatabaseView.subClass({
    init: function() {
        this._super();

        this.singularName = 'Profile';
        this.pluralName = 'Profiles';
        var self = this;

        this.getData(function(){
            self.finish();
        });
    },

    beforeRender: function() {},

    setupEvents: function() {
        //New button
        $('#new-profile').on('click', function(){
            document.location = '/Profiles/new';
        });

        var $view = $('.database-view');

        //Edit button
        $view.on('click', 'button.profile-edit', function(event){
            var id = $(this).parents('.list-group-item').find('input.profile-id').val();
            document.location = '/Profiles/edit/' + id;
        });

        //Delete button
        $view.on('click', 'button.profile-delete', function(event){
            var id = $(this).parents('.list-group-item').find('input.profile-id').val();
            var name = $(this).parents('.list-group-item').find('.profile-name').text();
            var response = window.confirm(Tools.format('Are you sure you want to delete the Profile "%s"?', name));

            if (response === true) {
                $.ajax({
                    url: '/Profiles/delete',
                    type: 'POST',
                    data: {id: id},
                    success: function() {
                        document.location = document.location;
                    },
                    error: function(jqXHR, textStatus, errorThrown) {
                        alert('Problem deleting Profile: ' + errorThrown);
                        //document.location = document.location;
                    }
                });
            }
        });


        //Run button
        $view.on('click', 'button.profile-run', function(event){
            var id = $(this).parents('.list-group-item').find('input.profile-id').val();
            document.location = '/Profiles/run/' + id;
        });
    },

    render: function() {
        var self = this;
        $.each(this.data, function(i, val){
            var $row = self.$template.clone();
            $row.find('.client-name').text(val['client_name']);
            $row.find('.server-name').text(val['server_name']);
            $row.find('.profile-name').text(val['profile_name']);
            $row.find('input.profile-id').val(val['id']);
            self.$container.append($row);
        });
    },

    finish: function() {
        this.beforeRender();
        this.render();
        this.setupEvents();
    }

});

var ProfileNew = DatabaseViewAbstract.subClass({
    init: function() {
        this.$container = $('.database-view');
        this.singularName = 'Profile';
        this.pluralName = 'Profiles';

        var self = this;

        this.getDataFrom('Servers', function(data){
            self.servers = data;
            self.getDataFrom('ExcludedTables', function(data){
                self.excludedTables = data;
                self.finish();
            });
        });
    },

    setupEvents: function(){
        var self = this;
        //Save button
        $('button.save-button').on('click', function(event){
            var $inputs = $('form#profile-form').find(':input').not(':button');
            if (!Tools.validate($inputs, self.$container)) {
                window.scrollTo(0,0);
                return false;
            }
            $.ajax({
                url: Tools.format('/%s/save', self.pluralName),
                type: 'POST',
                data: $inputs.serialize(),
                success: function() {
                    document.location = '/Profiles';
                }
            });
        });
    },

    render: function() {
        //Render select box for servers
        var $serverSelect = $('select#server_id');
        $serverSelect.append('<option value="">Please select a server...</option>');
        $.each(this.servers, function(i, val){
            var label = Tools.format('%s - %s', val['client_name'], val['server_name']);
            $serverSelect.append(Tools.format('<option value="%s">%s</option>', val['id'], label));
        });

        //Render excluded table checkboxes
        this.setupTableCheckboxes();
    },

    /**
     * Sets up table checkboxes for the template, before cloning and attaching to each form
     */
    setupTableCheckboxes: function() {
        var tables = this.excludedTables;
        var container = $('#excluded-tables');
        var len = tables.length;


        for (var i = 0; i < len; i++) {
            var $chkContainer = $('<div class="col-md-6"></div>').append('<div class="checkbox"></div>');
            var identifier = 'checkbox_' + tables[i];
            var label = $('<label></label>')
                .text(tables[i])
                .attr('for', identifier)
                .appendTo($chkContainer.children());
            var checkbox = $('<input type="checkbox" class="excluded-table-checkbox" />')
                .attr('name', 'excluded_tables')
                .attr('id', identifier)
                .prop('checked', true)
                .val(tables[i])
                .appendTo(label);
            container.append($chkContainer);
        }
        $('<div style="clear:both"></div>').appendTo(container);

        //Checkbox toggles for tables
        var $tableControls = $('.table-controls');
        $tableControls.on('click', '.select-all', function(){
            $('#excluded-tables').find('input[type=checkbox]').prop('checked', true);
        });
        $tableControls.on('click', '.select-none', function(){
            $('#excluded-tables').find('input[type=checkbox]').prop('checked', false);
        });

        //TODO: vvvvv Get a working dropdown again vvvvv

        //$('#table-checkboxes-container').on('click', '.tables-toggle', function(event){
        //    var $tablesContent = $(event.delegateTarget).find('#tables-content');
        //
        //    if (!$tablesContent.hasClass('show')) {
        //        $tablesContent.addClass('show').slideDown();
        //        $(this).find('span').removeClass('glyphicon-expand').addClass('glyphicon-collapse-down');
        //    }
        //    else {
        //        $tablesContent.removeClass('show').slideUp();
        //        $(this).find('span').removeClass('glyphicon-collapse-down').addClass('glyphicon-expand');
        //    }
        //});
    }
});

var ProfileEdit = ProfileNew.subClass({
    init: function(profile) {
        this.profile = profile;

        this.$container = $('.database-view');
        this.singularName = 'Profile';
        this.pluralName = 'Profiles';

        var self = this;

        this.getData(function(){
            self.getDataFrom('Servers', function(data){
                self.servers = data;
                self.getDataFrom('ExcludedTables', function(data){
                    self.excludedTables = data;
                    self.finish();
                });
            });
        });
    },

    render: function() {
        this._super();

        //Set values of inputs
        $('input#profile_name').val(this.profile['profile_name']);
        $('input#magento_path').val(this.profile['magento_path']);
        $('select#server_id').val(this.profile['server_id']);

        try {
            var excludedTables = JSON.parse(this.profile['excluded_tables']);
        }
        catch (e) {
            alert("Problem parsing JSON data for excluded tables. Please review data or contact a dev: \n"+e);
            return false;
        }
        $('input.excluded-table-checkbox').attr('checked', false);

        $.each(excludedTables, function(key, val){
            $(Tools.format('#checkbox_%s', val)).prop('checked', true);
        });
    }

});

var RunProfile = DatabaseViewAbstract.subClass({
    init: function(profile) {
        var self = this;
        this.$container = $('#profile-run');
        this.getDataFrom('Profiles', function(data){
            self.profiles = data;
            self.finish();
        });
    },

    render: function() {
        var $profileSelect = $('#profile_id');
        $profileSelect.append('<option value="">Please select a profile...</option>');
        $.each(this.profiles, function(i, val){
            var label = Tools.format('%s - %s - %s', val['client_name'], val['server_name'], val['profile_name']);
            $profileSelect.append(Tools.format('<option value="%s">%s</option>', val['id'], label));
        });
    },

    setupEvents: function() {
        var self = this;

        //Show/hide password input
        $('.form-group-radio input[type=radio]').on('click', function(){
            if ($(this).is('.password')) {
                $('.form-group.password').show();
                $('.form-group.password input').attr('disabled', false);
            }
            else {
                $('.form-group.password').hide();
                $('.form-group.password input').attr('disabled', true);
            }
        });

        //Run / Test buttons
        var isDbConnRunning = false;
        $('#test-button, #run-button').on('click', function(event){
            if (isDbConnRunning === true) {
                window.alert('A profile is currently running, cannot continue');
                event.stopPropagation();
                return false;
            }
            isDbConnRunning = true;

            var $inputs = $('#run-form').find(':input').not(':button');
            if (!Tools.validate($inputs, self.$container)) {
                isDbConnRunning = false;
                return false;
            }

            var url;
            if ($(this).is('#run-button')) {
                url = '/runDatabaseConfiguration';
            }
            else {
                url = '/testDatabaseConnection';
            }

            Tools.showWait();

            var $messages = $('#database-messages');
            $messages.empty();

            $.ajax({
                url: url,
                dataType: 'json',
                type: 'POST',
                data: $inputs.serialize(),
                success: function(data) {
                    if (data['messages'] && data['messages'].length) {
                        $.each(data['messages'], function(i, val){
                            $messages.append($('<li class="list-group-item bg-success"></li>').text(val));
                        });
                    }
                    if (data['error']) {
                        $messages.append($('<li class="list-group-item bg-danger"></li>').text(data['error']));
                    }
                    console.log('DatabaseConnection::onsuccess', data);
                },
                error: function(xhr, status, errorThrown){
                    var response = xhr.responseText;
                    if (status == 'parsererror') {
                        console.error('Error with response from database connection test:', response, errorThrown);
                    }
                },
                complete: function() {
                    Tools.hideWait();
                    isDbConnRunning = false;
                    console.log('DatabaseConnection::oncomplete');
                }
            });
        });
    }
});