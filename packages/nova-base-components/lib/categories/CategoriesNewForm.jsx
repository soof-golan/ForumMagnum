import React, { PropTypes, Component } from 'react';
//import { Messages } from 'nova-core';
import Categories from 'nova-categories';
import NovaForm from 'nova-forms';

const CategoriesNewForm = (props, context) => {

  return (
    <div className="categories-new-form">
      <NovaForm 
        collection={Categories} 
        currentUser={context.currentUser}
        methodName="categories.new"
        successCallback={(category)=>{
          context.messages.flash("Category created.", "success");
        }}
      />
    </div>
  )
}

CategoriesNewForm.displayName = "CategoriesNewForm";

CategoriesNewForm.contextTypes = {
  currentUser: React.PropTypes.object,
  messages: React.PropTypes.object
};

module.exports = CategoriesNewForm;
export default CategoriesNewForm;