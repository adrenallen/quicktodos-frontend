import { Dialog, DialogTitle, TextField, Button } from "@material-ui/core";
import React from 'react';
import MuiAlert from '@material-ui/lab/Alert';
import Snackbar from '@material-ui/core/Snackbar';

import './ShareDialog.css';

export default function ShareDialog(props) {
    const [copyAlert, setCopyAlert] = React.useState(false);
    const {open, onClose} = props;

    const handleClose = () => {
        onClose();
    }

    const fallbackCopyTextToClipboard = (text) => {
        var textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position="fixed";  //avoid scrolling to bottom
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
      
        try {
          var successful = document.execCommand('copy');
          var msg = successful ? 'successful' : 'unsuccessful';
          console.log('Fallback: Copying text command was ' + msg);
        } catch (err) {
          console.error('Fallback: Oops, unable to copy', err);
        }
      
        document.body.removeChild(textArea);
    }

    const copyTextToClipboard = (text) => {
        if (!navigator.clipboard) {
            fallbackCopyTextToClipboard(text);
            return;
        }
        navigator.clipboard.writeText(text).then(function() {
            console.log('Async: Copying to clipboard was successful!');
        }, function(err) {
            console.error('Async: Could not copy text: ', err);
        });
    }

    const Alert = (props) => {
        return <MuiAlert elevation={6} variant="filled" {...props} />;
    }

    return (
        <React.Fragment>
            <Dialog className='share-dialog' open={open} onClose={handleClose} fullWidth={true} maxWidth="lg">
                <DialogTitle>Share this list!</DialogTitle>
                <TextField onClick={(event) => {event.target.select();}} className='copy-text' variant="outlined" value={window.location.href}></TextField>
                <Button className='copy-button' variant="contained" color="primary" onClick={() => {copyTextToClipboard(window.location.href); setCopyAlert(true);}}>Copy</Button>
                <Snackbar open={copyAlert} autoHideDuration={3000} onClose={() => {setCopyAlert(false);}}>
                    <Alert onClose={() => {setCopyAlert(false);}} severity="success">Copied to clipboard!</Alert>
                </Snackbar>
            </Dialog>            
        </React.Fragment>
    );

    
}