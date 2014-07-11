
function SiteProfiles() {
    var siteProfiles;
    var $template = $('#profile-template').children().first().clone();
    var $container = $('#site-profiles');

    //Populate site profiles data
    Tools.getSiteProfiles(function(data){
        siteProfiles = data;
        afterProfiles();
    });

    function afterProfiles() {
        Tools.getSshConfig(function(data){
            //Add SSH Config values to select, pulled from ajax json response
            var $select = $('<select class="form-control" name="ssh-config-name"></select>');
            $select.append('<option value="">Select an SSH Config entry...</option>');
            for (var key in data) {
                if (data.hasOwnProperty(key)) {
                    $select.append($('<option></option>').val(key).text(data[key]['label']));
                }
            }
            $template.find('.ssh-config').append($select);

            //Follow-up with creating the Add block from the generated template
            createAddBlock();
            renderProfiles();
            setupEvents();
        });
    }

    function setupEvents() {
        //Save button
        $container.on('click', '.save-button', function(event){
            var $inputContainer = $(event.target).parents('.panel-primary');
            var $inputs = $inputContainer.find(':input').not(':button');
            if (!Tools.validate($inputs, $container)) {
                return false;
            }
            $.ajax({
                url: '/saveSiteProfile',
                type: 'POST',
                data: $inputs.serialize(),
                success: function() {
                    document.location = document.location;
                }
            });
        });

        //Delete button
        $container.on('click', '.delete-button', function(event){
            var $inputContainer = $(event.target).parents('.panel-primary');
            var name = $inputContainer.find(':input[name=profile-name]').val();
            if (!window.confirm('Do you wish to delete the profile "' + name + '"?')) {
                return false;
            }
            var key = $inputContainer.find(':input[name=key]').val();

            $.ajax({
                url: '/deleteSiteProfile',
                type: 'POST',
                data: {key: key},
                success: function() {
                    document.location = document.location;
                }
            });
        });
    }

    function renderProfiles() {
        $.each(siteProfiles, function(i, profile){
            var $profile = $template.clone().addClass('edit-profile panel-primary');
            $profile.find(':input[name=key]').val(i);
            $profile.find(':input[name=profile-name]').val(profile['profileName']);
            $profile.find(':input[name=ssh-config-name]').val(profile['sshConfigName']);
            $profile.find(':input[name=site-path]').val(profile['sitePath']);

            $profile.prepend($('<div class="panel-heading"></div>').text(profile['profileName']));

            //Save button
            $profile.find('.panel-body').append('<div class="buttons"><button type="button" class="save-button btn btn-primary">Save</button></div>');

            //Delete button
            $profile.find('.panel-body').append('<div class="buttons"><button type="button" class="delete-button btn btn-xs btn-danger">Delete</button></div>');

            $container.append($profile);
        });
    }

    function createAddBlock() {
        var $addBlock = $template.clone().addClass('add-profile panel-success');
        $addBlock.prepend('<div class="panel-heading">New Site Profile</div>');
        $addBlock.find('.panel-body').append($('<div class="buttons"><button type="button" class="save-button btn btn-success">Add</button></div>'));
        $container.prepend($addBlock);
    }

}
