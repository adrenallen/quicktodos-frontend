import React, {Component} from 'react';
import TouchBackend from 'react-dnd-touch-backend'
import Fab from '@material-ui/core/Fab';
import TextField from '@material-ui/core/TextField'
import AddIcon from '@material-ui/icons/Add';
import { List, ListItemSecondaryAction, ListItem, ListItemAvatar, ListItemText, IconButton, Checkbox, Button, ExpansionPanel, ExpansionPanelSummary, ExpansionPanelDetails, InputAdornment, Backdrop } from '@material-ui/core';
import Typography from '@material-ui/core/Typography';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import HighlightOffIcon from '@material-ui/icons/HighlightOff';
import ShareIcon from '@material-ui/icons/Share';
import CircularProgress from '@material-ui/core/CircularProgress';
import ShareDialog from './ShareDialog';
import Backend from 'react-dnd-html5-backend';
import { DndProvider } from 'react-dnd'
import TodoListItem from './TodoListItem';

import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'

import './TodoList.css';

const TouchBackendOpts = {
  enableMouseEvents: true
};

// Guess if mobile based on window shape... Best I can do
//This will set the appropriate backend, basically we only want to give them the good
//"Backend" if we are pretty sure they are on PC, otherwise it wont work at all
const SortBackend = (window.innerWidth <= 760 || window.innerHeight <= 500) ? TouchBackend : Backend;

const MySwal = withReactContent(Swal)

const SwalStylings = {
  confirmButtonColor: '#3f51b5'
}

const ActionTypes = {
  update: 1,
  delete: 2,
  task_create: 3,
  task_update: 4,
  task_delete: 5,
  subscribe: 6,
  task_focus: 7,
  task_order: 8
};

class TodoList extends Component {
    
    
    ws = null;
    offlineMode = false;

    windowFocused = false;
    trySilentReconnect = false; //try to silently reconnect to WS

    state = {
      list: {
        name: "",
        slug: "",
        editors: []
      },
      tasks: [],
      wsId: null,
      
      shareDialogOpen: false,

      showLoadingBackdrop: false,

      readOnlyMode: false
    };
    constructor(props){
      super(props);
      this.slug = this.props.match.params.slug;
      this.listNameChange = this.listNameChange.bind(this);
    }

    componentDidMount(){
      this.reconnectWS();

      //Tracking window focus so that
      //we can auto reconnect the WS on refocus if it
      //was dropped
      window.onfocus = () => {
        this.windowFocused = true;
        if(this.trySilentReconnect){
          this.reconnectWS();
          this.trySilentReconnect = false;
        }
      };

      window.onblur = () => {
        this.windowFocused = false;
      };
    }

    setOfflineMode(mode){
      this.offlineMode = mode;
      this.setState({readOnlyMode: mode});
    }

    wsConnectionAttempts = 0;
    reconnectWS(){
      this.showLoading(true);
      this.ws = new WebSocket('ws://localhost:8999');
      // this.ws = new WebSocket('wss://api.quicktodos.com');
      this.ws.addEventListener('open', event => {
        this.showLoading(false);
        this.setOfflineMode(false);
        this.wsConnectionAttempts = 0;

        //On open subscribe to our stub!
        this.sendActionToAPIWithSlug(ActionTypes.subscribe)
        
      });

      this.ws.addEventListener('message', this.handleMessage.bind(this));

      this.ws.onclose = (event) => {
        this.setOfflineMode(true);

        //If window is focused then prompt for reconnect
        if(this.windowFocused){
          this.trySilentReconnect = false;
          if(this.wsConnectionAttempts > 5){
            this.showError(
              "Sorry, connection could not be established",
              "You're offline"
            );
            this.showLoading(false);
          } else {
            var message = (this.wsConnectionAttempts > 0) ? "Failed to connect, try again?" : "Do you want to try and reconnect?";
            this.showSwal(message, "Connection Lost!", 'error', {
              showCancelButton: true,
              confirmButtonText: "Yes, reconnect",
              cancelButtonText: "Stay offline",
              allowOutsideClick: false,
              allowEscapeKey: false
            }).then((res) => {
              if(res.value){
                this.wsConnectionAttempts++;
                this.reconnectWS();
              }else{
                this.showLoading(false);
              }
            });
          }
        }else{
          //If window is not focused, try silent reconnect on focus
          this.trySilentReconnect = true;
        }

      };
    }

    showLoading(show){
      this.setState({showLoadingBackdrop: show});
    }

    render() {
      return (
        <div className='content-div'>
          <div className='header-box'>
            <IconButton disabled={this.state.readOnlyMode} className='DeleteListIconButton' onClick={() => { this.sendDelete(); }} aria-label="delete">
              <HighlightOffIcon color="secondary"/>
            </IconButton>
            <IconButton size="small" className='home-icon-button' onClick={() => { window.location.assign('/'); }}>
              <img src='./qt_fav.png' className='home-icon' />
            </IconButton>
            <div className='list-name-box'>
              <TextField
                multiline={true}
                className='list-name-input'
                onChange={this.listNameChange}
                value={this.state.list.name}
                InputProps={{
                  endAdornment: <InputAdornment position="end">
                    <IconButton edge="end" onClick={this.clickShare.bind(this)} aria-label="share" size="small">
                      <ShareIcon />
                      {/* Share */}
                    </IconButton>
                  </InputAdornment>
                }}
                disabled={this.state.readOnlyMode}
              ></TextField>
            </div>
          </div>
          {this.getIncompleteListItemsComponents()}
          
          <div className='add-button-box'>
            <Fab
              size='medium'
              className='add-button'
              color="primary"
              aria-label="Add"
              onClick={() => { this.sendTaskCreated(); } } 
              variant="extended"
              disabled={this.state.readOnlyMode}
              >
              <AddIcon />
            </Fab>
          </div>
          {/* <span className='center-everything' >
            <Button 
              disabled={this.state.readOnlyMode}
              className="add-button"
              variant="contained"
              color="primary"
              onClick={() => { this.sendTaskCreated(); } } 
              >New Item</Button>
          </span> */}
          

          {this.getCompleteListItemsComponents()}

          <ShareDialog open={this.state.shareDialogOpen} onClose={() => {this.setState({shareDialogOpen: false}); }}></ShareDialog>  
          <Backdrop open={this.state.showLoadingBackdrop}>
            <CircularProgress color="inherit" />
          </Backdrop>
        </div>
      );
    }

    showError(message, title){
      return this.showSwal(message, title || "Uh oh, something happened!", 'error');
    }

    showWarning(message, title){
      return this.showSwal(message, title || 'Heads-up!', 'warning');
    }

    showYesNoConfirmation(message, title){
      return this.showSwal(message, title, 'info', {
        showCancelButton: true,
        confirmButtonText: "Yes, delete it"
      });
    }

    showSwal(message, title, icon, data){
      return MySwal.fire({
        title: title,
        text: message,
        icon: icon,
        confirmButtonText: 'Okay',
        ...data,
        ...SwalStylings
      });
    }

    clickShare(){
      this.setState({shareDialogOpen: true});
    }

    getIncompleteListItemsComponents(){
      const items = this.getListItemComponents(false);
      if(items.length < 1){
        return <div className='center-everything no-items-left'>You don't have any items left!</div>;
      }

      return (
        <DndProvider backend={SortBackend} options={TouchBackendOpts}>
          <List>
            {this.getListItemComponents(false)}
          </List>
        </DndProvider>
      );
    }

    getCompleteListItemsComponents(){
      const completedItems = this.getListItemComponents(true);
      if(completedItems.length < 1){
        return null;
      }

      return (
        <ExpansionPanel className="ExpansionPanel">
          <ExpansionPanelSummary expandIcon={<ExpandMoreIcon />} id="completed-panel-header">
            <Typography>Completed ({completedItems.length})</Typography>
          </ExpansionPanelSummary>
          <ExpansionPanelDetails>
            <DndProvider backend={SortBackend} options={TouchBackendOpts}>
              <List className='ExpansionPanelList'>
                {completedItems}
              </List>
            </DndProvider>
          </ExpansionPanelDetails>
        </ExpansionPanel>
      );
    }

    moveItem(dragIdx, hoverIdx){
      if(this.isTaskFocused(this.state.tasks[dragIdx])) return;
      
      //Move the item to the dragged spot
      this.state.tasks.splice(hoverIdx, 0, this.state.tasks.splice(dragIdx, 1)[0]);

      //Now reassign order #'s by index, putting complete at top and incomplete at bottom
      var tasks = [
        ...(this.state.tasks.filter(task => !task.completed)),
        ...(this.state.tasks.filter(task => task.completed))
      ];
      tasks.forEach((task, idx) => {task.order = idx});
      this.setState({tasks});

      //TODO - send updated orders to api
      this.sendActionToAPIWithSlug(ActionTypes.task_order, {
        task_orders: tasks.map((task) => {
          return {
            task_id: task.id,
            order: task.order
          };
        })
      });
    }

    sortTasksAndUpdate(){
      this.setState({
        tasks: this._sortTasks(this.state.tasks)
      })
    }

    _sortTasks(tasks){
      return [
        ...(tasks.filter(task => !task.completed).sort(this._sortItemsByOrder)),
        ...(tasks.filter(task => task.completed).sort(this._sortItemsByOrder))
      ];
    }
    _sortItemsByOrder(a,b){
      if(a.order == null && b.order != null){
        return 1;
      }else if (a.order != null && b.order == null){
        return -1;
      }else if (a.order == null && b.order == null){
        return 0;
      }

      return a.order - b.order;
    }



    getListItemComponents(completed = false){
      var comps = [];
      if(this.state.tasks.length < 1){
        return comps;
      }

      var idxOfLast = 0;
      this.state.tasks
        .forEach((task, idx) => {
          if(task.completed != completed) return;
          idxOfLast = idx;
        });

      this.state.tasks
        // .filter(task => task.completed == completed)
        .forEach((task, idx, tasks) => {
          if(task.completed != completed) return; //this is here so we can access the index of main array
          var isLast = idx == idxOfLast;
          var isTaskFocused = this.isTaskFocused(task.id);
          comps.push(
            <TodoListItem
              listItemType={completed ? "complete_item" : "incomplete_item"}
              key={task.id}
              id={task.id}
              task={task}
              index={idx}
              moveItem={this.moveItem.bind(this)}
              readOnlyMode={this.state.readOnlyMode}
              isTaskFocused={isTaskFocused}
              sendTaskUpdated={this.sendTaskUpdated.bind(this)}
              handleTaskFocus={this.handleTaskFocus.bind(this)}
              sendTaskDeleted={this.sendTaskDeleted.bind(this)}
              sendTaskCreated={this.sendTaskCreated.bind(this)}
              isLast={isLast}
            ></TodoListItem>
          );
      });
      return comps;
    }

    isTaskFocused(taskID){
      return this.state.list.editors.some(e => e.task_id == taskID && e.ws_id != this.state.wsId);
    }

    //Should focus new task if we just created one!
    shouldFocusNewTask = false;
    sendTaskCreated(){
      this.shouldFocusNewTask = true;
      this.sendActionToAPIWithSlug(ActionTypes.task_create);
    }

    handleTaskCreated(newTask){
      if(this.shouldFocusNewTask) {
        newTask.autoFocus = true;
        this.shouldFocusNewTask = false;
      }
      this.state.tasks.push(newTask);
      this.sortTasksAndUpdate();
    }

    sendTaskDeleted(id){
      this.showYesNoConfirmation("This action cannot be undone!", "Delete this item?")
        .then((res) => {
          if(res.value){
            //Auto delete our task locally, in case offline
            this.handleTaskDeleted(id);

            this.sendActionToAPIWithSlug(ActionTypes.task_delete, {
              "task_id": id
            });
          }
        });
      
    }

    handleTaskDeleted(id) {
      this.state.tasks = this.state.tasks.filter(task => task.id != id);
      this.setState({tasks: this.state.tasks});
    }

    cleanUserDescriptions(text){
      if (text == null) return "";

      var cleanText =  text.replace(/[<>\n]/g, "");
      if(cleanText.length > 255){
        cleanText = cleanText.substring(0, 255);
      }
      return cleanText;
    }
    taskUpdateTimeout = null;
    sendTaskUpdated(id, description, completed, sendDelay = 300){
      if(this.taskUpdateTimeout != null) {
        clearTimeout(this.taskUpdateTimeout);
      }

      description = this.cleanUserDescriptions(description);
      
      //Auto update our task locally
      this.handleTaskUpdated(id, description, completed);

      //Wait to propagate change until done typing
      this.taskUpdateTimeout = setTimeout(() => {
        this.sendActionToAPIWithSlug(ActionTypes.task_update, {
          "task_id": id,
          description,
          completed
        });
      }, sendDelay);
      
    }

    handleTaskUpdated(id, description, completed){
      var idx = this.state.tasks.findIndex(task => task.id == id);
      this.state.tasks[idx].description = description;
      this.state.tasks[idx].completed = completed;
      this.setState({tasks: this.state.tasks});
    }

    nameChangeTimeout = null;
    listNameChange(event){
      if(this.nameChangeTimeout != null) {
        clearTimeout(this.nameChangeTimeout);
      }

      event.target.value = this.cleanUserDescriptions(event.target.value);
      
      this.state.list.name = event.target.value;
      this.setState({ list: this.state.list });

      //Timeout to propagate change
      this.nameChangeTimeout = setTimeout(() => {
        this.sendActionToAPIWithSlug(ActionTypes.update, {"name": this.state.list.name});
        this.setWindowTitle(this.state.list.name);
      }, 300);
      
    }

    sendDelete(){
      this.showYesNoConfirmation("This action cannot be undone!", "Delete this list?")
        .then((res) => {
          if(res.value){
            this.sendActionToAPIWithSlug(ActionTypes.delete);
          }
        });      
    }

    handleDelete(){
      this.showWarning("You are being redirected to the home page!", "List was deleted!")
        .then(() => {
          window.location.replace('/');
        });      
    }

    taskFocusTimeout = null;
    taskFocusTimeoutMS = 200;

    handleTaskFocus(taskID){
      if(this.taskFocusTimeout != null){
        clearTimeout(this.taskFocusTimeout);
      }
      this.taskFocusTimeout = setTimeout(() => {
        this.sendActionToAPIWithSlug(ActionTypes.task_focus, {
          task_id: taskID
        });
      }, this.taskFocusTimeoutMS);

    }

    handleTaskFocused(taskID, wsID){
      var idx = this.state.list.editors.findIndex(e => e.ws_id == wsID);
      if(idx < 0){
        this.state.list.editors.push({ws_id: wsID, task_id: taskID});
      }else{
        this.state.list.editors[idx].task_id = taskID;
      }
      this.setState({list: this.state.list});
    }

    handleTaskOrdered(taskOrders) {
      var tasks = this.state.tasks;
      taskOrders.forEach(to => {
        tasks.find(t => t.id == to.task_id).order = to.order;
      });
      this.setState({tasks});
      this.sortTasksAndUpdate();
    }

    setWindowTitle(title){
      document.title = title + " - QuickTodos";
    }

    handleMessage(event){
      var data = JSON.parse(event.data);
      switch(data.action){
        case ActionTypes.subscribe:
          if(data.list.editors == null) data.list.editors = []; //backwards compatibility tweak
          this.setState({ list: data.list, tasks: this._sortTasks(data.list.tasks), wsId: data.ws_id });
          this.setWindowTitle(this.state.list.name);
          break;
        case ActionTypes.delete:
          this.handleDelete();
          break;
        case ActionTypes.update:
          this.state.list.name = data.name;
          this.setState({list: this.state.list});
          break;
        case ActionTypes.task_create:
          this.handleTaskCreated(data.task);
          break;
        case ActionTypes.task_delete:
          this.handleTaskDeleted(data.task_id);
          break;
        case ActionTypes.task_update:
          this.handleTaskUpdated(data.task_id, data.description, data.completed);
          break;
        case ActionTypes.task_focus:
          this.handleTaskFocused(data.task_id, data.ws_identifier);
          break;
        case ActionTypes.task_order:
          this.handleTaskOrdered(data.task_orders);
          break;
        case undefined:
          console.error(data);
          if(data.error != null){
            this.showError(data.error).then(() => {
              //If we still don't have a list slug,
              //we didnt find the list so just redirect home
              if(this.state.list.slug == ""){
                window.location.replace('/');
              }
            });
          }
          break;
        default:
          console.error(data);
          break;
      }

    }

    sendActionToAPIWithSlug(action, data){
      this.sendActionToAPI(action, {
        slug: this.slug,
        ...data
      });
    }


    sendActionToAPI(action, data){
      if(this.offlineMode) return; //TODO - store this in history?
      
      this.ws.send(JSON.stringify({
        action: action,
        ...data
      }), console.error);
    }



  }
  
  export default TodoList;