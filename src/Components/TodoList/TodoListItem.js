import React, { useRef } from 'react'
import { useDrag, useDrop } from 'react-dnd'
import DeleteIcon from '@material-ui/icons/Delete';
import EditIcon from '@material-ui/icons/Edit';
import DragIndicatorIcon from '@material-ui/icons/DragIndicator';
import { ListItemSecondaryAction, ListItem, ListItemAvatar, ListItemText, IconButton, Checkbox, InputAdornment } from '@material-ui/core';

import TextField from '@material-ui/core/TextField'
import './TodoListItem.css';


const TodoListItem = ({ 
    id,
    task,
    index,
    moveItem,
    readOnlyMode,
    isTaskFocused,
    sendTaskUpdated,
    handleTaskFocus,
    sendTaskDeleted,
    sendTaskCreated,
    isLast,
    listItemType
}) => {
  const ref = useRef(null);
  const [, drop] = useDrop({
    accept: listItemType,
    hover(item, monitor) {
      if (!ref.current) {
        return
      }
      const dragIndex = item.index
      const hoverIndex = index
      // Don't replace items with themselves
      if (dragIndex === hoverIndex) {
        return
      }
      // Determine rectangle on screen
      const hoverBoundingRect = ref.current.getBoundingClientRect();
      // Get vertical middle
      const hoverMiddleY =
        (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      // Determine mouse position
      const clientOffset = monitor.getClientOffset();
      // Get pixels to the top
      const hoverClientY = clientOffset.y - hoverBoundingRect.top;
      // Only perform the move when the mouse has crossed half of the items height
      // When dragging downwards, only move when the cursor is below 50%
      // When dragging upwards, only move when the cursor is above 50%
      // Dragging downwards
      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
        return;
      }
      // Dragging upwards
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
        return;
      }
      // Time to actually perform the action
      moveItem(dragIndex, hoverIndex);
      // Note: we're mutating the monitor item here!
      // Generally it's better to avoid mutations,
      // but it's good here for the sake of performance
      // to avoid expensive index searches.
      item.index = hoverIndex;
    },
  });
  const [{ isDragging }, drag, preview] = useDrag({
    item: { type: listItemType, id, index },
    collect: monitor => ({
      isDragging: monitor.isDragging(),
    }),
  });
  const opacity = isDragging ? 0.4 : 1;
  drag(drop(ref));


  return (
    <ListItem key={task.id} ref={preview}>
        <ListItemAvatar ref={ref}>
            <>
            <IconButton disabled={(readOnlyMode || isTaskFocused)} size="small" ref={ref}>
                <DragIndicatorIcon />
            </IconButton>
            <Checkbox
                disabled={readOnlyMode || isTaskFocused}
                checked={task.completed == true}
                onChange={(event) => { sendTaskUpdated(task.id, task.description, event.target.checked, 0); }}
                color="primary"
                />
            </>
        </ListItemAvatar>
        <ListItemText>
            <TextField
                error={isTaskFocused}
                InputProps={{
                  startAdornment: isTaskFocused ? 
                    (<InputAdornment position="start">
                        <EditIcon color="error" />
                    </InputAdornment>) : null
                }}
                inputProps={{
                  tabIndex: 1000 + index
                }}
                onBlur={() => {handleTaskFocus(null);}}
                onFocus={() => {handleTaskFocus(task.id);}}
                disabled={readOnlyMode || isTaskFocused}
                multiline={true}
                onKeyPress={isLast ? (e) => { if(e.key == 'Enter' && task.description.length > 0){ sendTaskCreated(); }} : null}
                autoFocus={task.autoFocus}
                placeholder="New List Item"
                fullWidth
                className={ 'item-textfield ' + (task.completed ? 'completed-task-textfield' : '') }
                onChange={(event) => { sendTaskUpdated(task.id, event.target.value, task.completed); }}
                value={task.description}></TextField>
        </ListItemText>
        <ListItemSecondaryAction>
            <IconButton disabled={readOnlyMode || isTaskFocused} onClick={() => { sendTaskDeleted(task.id); }} edge="end" aria-label="delete">
                <DeleteIcon />
            </IconButton>
        </ListItemSecondaryAction>
    </ListItem>
  );
}
export default TodoListItem;
