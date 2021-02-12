import React from 'react';
import { Button, TextField, ButtonGroup, Container, Paper, Typography, ExpansionPanel, ExpansionPanelDetails, ExpansionPanelSummary, Backdrop, CircularProgress } from '@material-ui/core';
import axios from 'axios';
import ForumIcon from '@material-ui/icons/Forum';
import LockOpenIcon from '@material-ui/icons/LockOpen';
import SpeedIcon from '@material-ui/icons/Speed';
import HelpIcon from '@material-ui/icons/Help';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';

import './LandingPage.css';

import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'

const MySwal = withReactContent(Swal)

const SwalStylings = {
  confirmButtonColor: '#3f51b5'
}



const faqLine = (question, answer) => { return {question, answer}; };

const FAQ = [
  faqLine("Do lists ever expire?", "Lists are automatically deleted if they have not been accessed for 14 days."),
  faqLine("Can I set a password on my list?", "List passwords are planned for the version 2 release!"),
  faqLine("Is list data encrypted?", "Due to there not being user accounts or passwords, list data cannot be encrypted per user.  When list passwords are implemented, encryption will be added."),
  faqLine("Can I see a planned roadmap for quicktodos.com?", "An official roadmap is coming soon!"),
  faqLine("Can I reserve a specific URL?", "URL reservations are planned for a future release."),
  faqLine("Where can I send feedback?", (<span>Feedback can be emailed to <a href="mailto:feedback@quicktodos.com">feedback@quicktodos.com</a></span>))
];

class TodoMarketing extends React.Component {
  state = {
    listName: "",
    showLoadingBackdrop: false
  };
  render() {
    return (
        <div className='content-root'>
          <Backdrop className='loading-backdrop' open={this.state.showLoadingBackdrop}>
            <CircularProgress color="primary" />
          </Backdrop>
          <div className='top-color-bg default-padding-top-bottom'>
            <div className='header-box'>
              <img src='logo_inverse.png' className='header-logo'/>
              <h1 className='subheader-line'>Collaborative and disposable todo lists</h1>
              <h3 className='subheader-line-2'>Create a new todo list with the click of a button.  Share the link and collaborate with others in real-time.</h3>
            </div>
            <div className='new-list-box'>
              <div className='new-list-group'>
                <TextField
                  onChange={(event) => {
                    this.setState({listName: event.target.value})
                  }}
                  value={this.state.listName}
                  placeholder="New List Name"
                  variant="outlined"
                  className='new-list-input'
                  size="small"
                  onKeyPress={(e) => { if(e.key == 'Enter'){ this.createListAndOpen(); }}}
                  >
                </TextField>
                <Button className="new-list-button" variant="contained" color="primary" onClick={() => { this.createListAndOpen(); }}>Create A List</Button>
              </div>
            </div>
          </div>
          <div className='feature-grid restrict-middle default-padding-top-bottom'>
            <FeatureBox icon={<ForumIcon />} title="Collaborate in real-time" description="Changes are shared real-time with anyone else on your list, allowing you to collaborate without worrying about refreshing." />
            <FeatureBox icon={<LockOpenIcon />} title="No login required" description="Don't worry about registering for a user account, just share your unique link to start collaborating!"/>
            <FeatureBox icon={<SpeedIcon />} title="Simple and disposable" description="Need more than one list? Just create a new one! Lists are simple to use and completely disposable." />
          </div>
          <div className='faq-box'>
            <h2 className='faq-box-header'>Frequently Asked Questions</h2>
            <div className='faq-lines'>
            {
              FAQ.map((item, idx) => <FAQLine key={"FAQ" + idx} question={item.question} answer={item.answer} />)
            }
            </div>
          </div>
          <span className='copyright-notice'>Copyright {(new Date()).getFullYear()} User Defined LLC</span>
        </div>
      
    );
  }

  createListAndOpen(){
    this.setState({showLoadingBackdrop: true});
    // axios.post(`https://api.quicktodos.com/list/create`, {
      axios.post(`http://localhost:8999/list/create`, {
        name: this.state.listName
      })
      .then(res => {
          window.location.assign("/" + res.data.slug);
      }).catch(err => {
        MySwal.fire({
          title: "Failed to create list!",
          text: "Sorry about that... If this continues to happen, please contact support@quicktodos.com",
          icon: 'error',
          confirmButtonText: 'Okay',
          ...SwalStylings
        }).then(() => {this.setState({showLoadingBackdrop: false});});
      });
  }
}


function FAQLine(props) {
  var question = props.question;
  var answer = props.answer;

  return (
    <ExpansionPanel className='faq-line-expansion-panel'>
      <ExpansionPanelSummary expandIcon={<ExpandMoreIcon />}>
        {/* <HelpIcon htmlColor="#3b77d8" /> */}
        <span className='question-prefix'>Q.</span>
        {props.question}
      </ExpansionPanelSummary>
      <ExpansionPanelDetails>
        {props.answer}
      </ExpansionPanelDetails>
    </ExpansionPanel>
  );
}

function FeatureBox(props) {
  
  var icon = React.cloneElement(
    props.icon,
    {
      className: "icon",
      fontSize: "large",
      htmlColor: "#3b77d8"
      // htmlColor:'white'
    }
  );
  return (
      <Paper className='feature-box'>
        <div className='feature-box-icon'>
          {icon}
        </div>
        <h4 className='feature-box-title'>{props.title}</h4>
        <Typography className='feature-box-description'>
          {props.description}
        </Typography>
      </Paper>
  );
}

export default TodoMarketing;