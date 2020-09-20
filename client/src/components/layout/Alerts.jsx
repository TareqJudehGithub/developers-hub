import React from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
const Alert = ({ alerts }) => {
 return (
  <div>
   {
    // Check if alerts is not null and not empty:
    alerts != null
    &&

    alerts.length > 0
    && alerts.map(alert => (
     <div key={alert.id} className={`lert alert-${alert.alertType}`}>
      {alert.msg}
     </div>

    ))
   }
  </div>
 )

}

Alert.prototype = {
 setAlert: PropTypes.func.isRequired
}

const mapStateToProps = state => ({
 //prop_name:  state.reducer name in rootReducer.js:

 alerts: state.alert
})
export default connect(mapStateToProps)(Alert);