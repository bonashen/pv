define(['backbone',
    'underscore',
    'JST',
    'Draggabilly'],
    function (Backbone, _, JST, Draggabilly) {
    'use strict';

    var TaskView = Backbone.View.extend({
        template: JST['project:task'],
        className: 'task-view show-content',

        initialize: function (options) {
            this.tasks = options.tasks;
            if(options.task)
                this.task = options.task;
            else
               this.task = {
                    name: "",
                    estimateTime: "",
                    resource: "",
                    description: "",
                    attachments:[],
                    dependsOn: []
                };
            this.tasksList = this.getTasksList(true);
            this.dependenciesList = this.getTasksList(false);
        },

        render: function render() {
            this.$el.html(this.template({
                task: this.task,
                tasks: this.tasks,
                tasksList: this.tasksList,
                dependenciesList: this.dependenciesList
            }));
            return this;
        },

        events: {
            'click .tab-general' : 'taskGeneralInformation',
            'click .tab-dependencies' : 'taskDependenciesInformation',
            'click .tab-attachments' : 'taskAttachmentslInformation',
            'click .cancel-button' : 'hideTaskView',
            'click .ok-button' : 'onSubmitChanges',
            'change #add-attachment-file' : 'addAttachment',
            'click #delete-attachment' : 'deleteAttachment',
            'dblclick .task-item' : 'addTaskToList'
        },

        getTasksList: function(el){
            var isNotDependency = [];
            var isDependency = [];
            var len = this.task.dependsOn.length;
            for( var i = 0; i < this.tasks.length; i++) {
                var dependency = false;
                for( var j = 0; j < len; j++) {
                    if( this.tasks[i].taskId === this.task.dependsOn[j].taskId) {
                        dependency = true;
                        isDependency[isDependency.length] = { name : this.tasks[i].name, taskId : this.tasks[i].taskId};
                    }
                }
                if ((this.tasks[i].taskId !== this.task.taskId)&&( !dependency)) {
                    isNotDependency[isNotDependency.length] = { name : this.tasks[i].name, taskId : this.tasks[i].taskId};
                }
            }
            if(el) return isNotDependency;
            else return isDependency;
        },

        taskGeneralInformation: function(){
            this.makeTabVisible('.tab-general','.general-content');
            if(this.$el.find('.tab-dependencies').hasClass('w--current')) {
                this.makeTabUnvisible('.tab-dependencies','.dependencies-content');
            }
            if(this.$el.find('.tab-attachments').hasClass('w--current')){
                this.makeTabUnvisible('.tab-attachments','.attachments-content');
            }
        },

        taskDependenciesInformation: function(){
            this.makeTasksDraggable(this.tasksList, this.dependenciesList);
            this.makeTabVisible('.tab-dependencies','.dependencies-content');
            if(this.$el.find('.tab-general').hasClass('w--current')) {
                this.makeTabUnvisible('.tab-general','.general-content');
            }
            if(this.$el.find('.tab-attachments').hasClass('w--current')){
                this.makeTabUnvisible('.tab-attachments','.attachments-content');
            }
        },

        taskAttachmentslInformation: function(){
            this.makeTabVisible('.tab-attachments','.attachments-content');
            if(this.$el.find('.tab-dependencies').hasClass('w--current')) {
                this.makeTabUnvisible('.tab-dependencies','.dependencies-content');
            }
            if(this.$el.find('.tab-general').hasClass('w--current')){
                this.makeTabUnvisible('.tab-general','.general-content');
            }
        },

        makeTabUnvisible: function(tabName,tabContent){
            this.$el.find(tabName).removeClass('w--current');
            this.$el.find(tabContent).removeClass('show-content');
            this.$el.find(tabContent).addClass('hide-content');
        },

        makeTabVisible: function(tabName,tabContent){
            this.$el.find(tabName).addClass('w--current');
            this.$el.find(tabContent).removeClass('hide-content');
            this.$el.find(tabContent).addClass('show-content');
        },

        makeTasksDraggable: function(tasksList, dependenciesList) {
            var draggableElements = document.getElementsByClassName('task-item');
            var draggies = [];
            for (var i = 0; i < draggableElements.length; i++) {
                var draggableElem = draggableElements[i];
                draggies[i] = new Draggabilly(draggableElem, {
                    containment: '.tab-container'
                });
                draggies[i].on('dragEnd', onDragEnd);
                draggies[i].on('dragStart', onDragStart);
            }

            function onDragStart() {
                var newParent = $('.clone');
                $(this.element).css({'position':'absolute'});
                newParent.append(this.element);
                $(this.element).css({'top': this.relativeStartPosition.y-45+'px'});
                $(this.element).css({'left': this.relativeStartPosition.x+'px'});
                $(this.element).addClass('is-dragging');
            };

            function onDragEnd() {
                if (this.position.x >= 200) {
                    $("#dependencies-list tbody").append(this.element);
                    $(this.element).css({'position': 'relative'});
                    $(this.element).css({'left': '260'});

                }
                if (this.position.x < 200) {
                    $("#tasks-list tbody").append(this.element);
                    $(this.element).css({'position': 'relative'});
                    $(this.element).css({'left': '0'});
                }
                var trigger = false;
                for (var i = 0; i < tasksList.length; i++)
                    if (tasksList[i].taskId === $(this.element).attr('id')) {
                        dependenciesList[dependenciesList.length] = tasksList[i];
                        tasksList.splice(i, 1);
                        trigger = true;
                        break;
                    }
                if (!trigger)
                    for (var i = 0; i < dependenciesList.length; i++)
                        if (dependenciesList[i].taskId === $(this.element).attr('id')) {
                            tasksList[tasksList.length] = dependenciesList[i];
                            dependenciesList.splice(i, 1);
                        }
            };
        },

        addTaskToList: function(event){
            var element = $(event.currentTarget);
            var taskId = element.attr('id');
            var listName = element.parent().parent().attr('id');
            if(listName === 'tasks-list'){
                for( var i = 0; i < this.tasksList.length; i++)
                    if(this.tasksList[i].taskId === taskId){
                        this.dependenciesList.push(this.tasksList[i]);
                        this.tasksList.splice(i,1);
                        break;
                    }
                $("#dependencies-list tbody").append(element);
            }
            else{
                for( var i = 0; i < this.dependenciesList.length; i++)
                    if(this.dependenciesList[i].taskId === taskId){
                        this.tasksList.push(this.dependenciesList[i]);
                        this.dependenciesList.splice(i,1);
                        break;
                    }
                $("#tasks-list tbody").append(element);
            }
        },

        addAttachment: function (event) {
            event.preventDefault();
            var uploadfile = new FormData();
            uploadfile.append('file', $("#add-attachment-file").prop('files')[0]);
            var response = $.ajax({
                url:  '/rest/attachments',
                type: 'POST',
                data: uploadfile,
                contentType: false,
                processData: false,
                async:false
            });
            this.task.attachments[this.task.attachments.length] = JSON.parse(response.responseText);
            this.addAttachmentItem(this.task.attachments.length-1);
        },

        deleteAttachment: function (event) {
            event.preventDefault();
            var target = $(event.currentTarget);
            var attachmentId = target.data('id');
            var attachmentNumber;
            for(var i = 0; i < this.task.attachments.length; i++){
                if( this.task.attachments[i].attachmentId === attachmentId)
                    attachmentNumber = i;
            }
            var response = $.ajax({
                url:  '/rest/attachments/' + attachmentId,
                type: 'DELETE',
                contentType: false,
                processData: false,
                async:false
            });
            this.task.attachments.splice(attachmentNumber,1);
            this.deleteAttachmentItem(attachmentId);
        },

        addAttachmentItem: function(i){
            var parent = document.getElementsByClassName("task-attachments");
            var str = this.task.attachments[i].fileName;
            if(this.task.attachments[i].fileName.length>9)  { str = this.task.attachments[i].fileName.substring(0,9)+'..';}
            $( parent ).append("<div class='attachment-item'>" +
                "<div id='delete-attachment' data-id="+this.task.attachments[i].attachmentId +
                "><img src='/images/cancel.svg' class='delete'  alt='delete attachment'/></div>"+
                "<a class='file-reference' href="+this.task.attachments[i].relativePath+
                " target='_blank'><img src='/images/word.png' class='attachment-image' alt='attachment image'/>"+
                "<div class='attachment-name' id='reference-name'>"+str+"</div></a></div>");
        },

        deleteAttachmentItem: function(id){
            var attachmentItems = $('.attachment-item');
            for ( var i = 0; i < attachmentItems.length; i++){
                var attachmentId = $(attachmentItems[i]).find('#delete-attachment').attr('data-id');
                if (attachmentId === id)
                    $(attachmentItems[i]).remove();
            }
        },

        hideTaskView: function(event){
            event.preventDefault();
            this.$el.remove();
        },

        onSubmitChanges: function onSubmitChanges (){
            this.task.name = this.$el.find('.task-name').val();
            this.task.estimateTime = this.$el.find('.task-estimate').val();
            this.task.resource = this.$el.find('.task-resource').val();
            this.task.description = this.$el.find('.task-description').val();
            this.task.dependsOn = [];
            if(this.dependenciesList[0] !== undefined) {
                for (var i = 0; i < this.dependenciesList.length; i++)
                    this.task.dependsOn[i] = {taskId: this.dependenciesList[i].taskId};
            }
            else{
                this.task.dependsOn = false;
            }
            this.trigger('upsertTask', this.tasks, this.task);
            event.preventDefault();
            this.$el.remove();
        }

    });

    return TaskView;
});
