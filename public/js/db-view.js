var DatabaseView = Object.subClass({

    init: function() {
        this.$template = $('#template').children().first().clone();
        this.$container = $('.database-view');
        this.data = null;
        this.singularName = '';
        this.pluralName = '';
    },

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

    beforeRender: function() {},

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
            self.getDataFrom('servers', function(data){
                self.serverData = data;
                self.getDataFrom('excludedTables', function(data){
                    self.excludedTables = data;
                    self.finish();
                });
            });
        });
    },

    beforeRender: function() {
        var self = this;
        //Render select boxes for Server data
        this.$template.find('.panel-body select.server_id').each(function(i){
            var $select = $(this);
            $.each(self.serverData, function(i, v){
                var text = Tools.format('%s - %s', v['client_name'], v['server_name']);
                $select.append(Tools.format('<option value="%s">%s</option>', v['id'], text));
            });
        });

        this.setupTableCheckboxes();
    },

    render: function() {
        this._super();
        var self = this;

        //Change headings to include client name
        this.$container.find('.panel.edit .panel-heading').each(function(i){
            $(this).text(Tools.format('%s - %s - %s', self.data[i].client_name, self.data[i].server_name, $(this).text()));
        });

        //Add excluded tables checkboxes to all
        var $tablesTemplate;
        this.$container.find('.panel-body').each(function(i){
            $tablesTemplate = $('#table-checkboxes-container').clone(true);
            var $form = $('<div class="form-group"><label>Excluded Tables</label></div>').append($tablesTemplate);
            $(this).find('div.form-group').last().after($form);
        });
    },

    /**
     * Sets up table checkboxes for the template, before cloning and attaching to each form
     */
    setupTableCheckboxes: function() {
        var tables = this.excludedTables;
        var container = $('.table-checkboxes');
        var len = tables.length;

        for (var i = 0; i < len; i++) {
            var $chkContainer = $('<div class="col-md-6"></div>').append('<div class="checkbox"></div>');
            var label = $('<label></label>')
                .text(tables[i])
                .attr('for', tables[i])
                .appendTo($chkContainer.children());
            var checkbox = $('<input type="checkbox" />')
                .attr('name', 'tables')
                .attr('id', tables[i])
                .prop('checked', true)
                .val(tables[i])
                .appendTo(label);
            container.append($chkContainer);
        }
        $('<div style="clear:both"></div>').appendTo(container);

        //Checkbox toggles for tables
        var $tableControls = $('.table-controls');
        $tableControls.on('click', '.select-all', function(){
            $('.table-checkboxes').find('input[type=checkbox]').prop('checked', true);
        });
        $tableControls.on('click', '.select-none', function(){
            $('.table-checkboxes').find('input[type=checkbox]').prop('checked', false);
        });

        $('#table-checkboxes-container').on('click', '.tables-toggle', function(event){
            var $tablesContent = $(event.delegateTarget).find('#tables-content');

            if (!$tablesContent.hasClass('show')) {
                $tablesContent.addClass('show').slideDown();
                $(this).find('span').removeClass('glyphicon-expand').addClass('glyphicon-collapse-down');
            }
            else {
                $tablesContent.removeClass('show').slideUp();
                $(this).find('span').removeClass('glyphicon-collapse-down').addClass('glyphicon-expand');
            }
        });
    }
});