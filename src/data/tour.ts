/* eslint-disable */
  import { FlowTypes } from "src/app/shared/model/flowTypes";
  export const tour: FlowTypes.Tour[] = [
  {
    "flow_type": "tour",
    "flow_name": "test_tour",
    "status": "released",
    "rows": [
      {
        "type": "step",
        "title": "Weekly Workshops",
        "message_text": "Click this button to access the weekly workshops",
        "element": "#main-content > plh-home > ion-content > div > div:nth-child(1)",
        "route": "home"
      },
      {
        "type": "step",
        "title": "Title 2",
        "message_text": "This highlights an element",
        "element": "#main-content > plh-module-list > div > div > plh-module-focus-skin > div > div > div > ion-button",
        "route": "module_list"
      },
      {
        "type": "step",
        "title": "Title 3",
        "message_text": "Even more text",
        "route": "module_list"
      },
      {
        "type": "step",
        "title": "Select a module",
        "message_text": "Click the modules side panel to select a module",
        "element": "#main-content > plh-module-list > div > div > plh-module-focus-skin > div > plh-slide-panel-right > section > h3",
        "route": "module_list"
      },
      {
        "type": "step",
        "title": "Then click on a module section",
        "message_text": "Click on one of the sections to continue the module",
        "element": "#main-content > plh-module-page > ion-content > div > div > plh-module-focus-skin > div > plh-module-page-flow-component:nth-child(3) > module-list-flow-step-group > div:nth-child(1) > module-list-flow-step-item > div > div.step-item-button",
        "route": "module_page/mod_welcome_page"
      }
    ],
    "_xlsxPath": "plh_sheets_beta/plh_templating/tutorials/tour.xlsx"
  },
  {
    "flow_type": "tour",
    "flow_name": "home_page_tour",
    "status": "released",
    "rows": [
      {
        "type": "step",
        "title": "Weekly Workshops",
        "message_text": "Click this button to access the weekly workshops",
        "element": "#main-content > plh-home > ion-content > div > div:nth-child(1)",
        "route": "home"
      },
      {
        "type": "step",
        "title": "Start a workshop",
        "message_text": "Click here to continue your last workshop",
        "template_component_name": "workshop_button_0",
        "route": "template/workshop_buttons_temp"
      },
      {
        "type": "step",
        "title": "Parent Points",
        "message_text": "Click here to view your parent points",
        "element": "#main-content > plh-home > ion-content > div > div:nth-child(2)",
        "route": "home"
      },
      {
        "type": "step",
        "title": "Parent Centre",
        "message_text": "Click here to view the parent centre",
        "element": "#main-content > plh-home > ion-content > div > div:nth-child(3)",
        "route": "home"
      },
      {
        "type": "step",
        "title": "Settings",
        "message_text": "Come here to change your settings",
        "route": "settings"
      },
      {
        "type": "step",
        "title": "Workshop",
        "route": "template/w_self_care_stepper?nav_parent=w_self_care_buttons_temp&nav_parent_triggered_by=individual_button"
      }
    ],
    "_xlsxPath": "plh_sheets_beta/plh_templating/tutorials/tour.xlsx"
  },
  {
    "flow_type": "tour",
    "flow_name": "intro_tour",
    "status": "released",
    "rows": [
      {
        "type": "step",
        "title": "Welcome to @global.parent_app",
        "message_text": "<p>Welcome to @global.parent_app.</p>\n\n<p>You deserve to feel good, and have happier family relationships.</p>\n\n<p>This app will support you and your family in three ways.</p>",
        "template_component_name": "home_screen",
        "route": "template/home_screen"
      },
      {
        "type": "step",
        "title": "@global.weekly_workshops",
        "message_text": "<p>This big button takes you to your @global.weekly_workshops </p>\n\n<p> Once per week a new workshop will be ready for you - every time focusing on a different a parenting skill. </p>",
        "template_component_name": "tile_weekly_workshops",
        "route": "template/home_screen"
      },
      {
        "type": "step",
        "title": "Set up your @global.weekly_workshops",
        "message_text": "<p>The round button appears whenever there is something ready for you to do.</p> \n\n<p>Click <img src=\"/icon/round-button/play_2.svg\"> to tell us more about yourself, and choose when and how to do your @global.weekly_workshops  </p>",
        "template_component_name": "tile_weekly_workshops",
        "route": "template/home_screen"
      },
      {
        "type": "step",
        "title": "@global.parent_points",
        "message_text": "<p>This button takes you to the @global.parent_points </p>\n\n<p>See your success in self-care and parenting. </p>\n\n<p>Celebrate your daily achievements!</p>",
        "template_component_name": "tile_parent_points",
        "route": "template/home_screen"
      },
      {
        "type": "step",
        "title": "Do a relaxation activity",
        "message_text": "<p>The round button appears whenever there is something ready for you to do.</p> \n\n<p>Click <img src=\"/assets/icon/round-button/smile.svg\">  to try out a quick relaxation activity </p>",
        "template_component_name": "tile_parent_points",
        "route": "template/home_screen"
      },
      {
        "type": "step",
        "title": "@global.parent_centre",
        "message_text": "<p>This button takes you to the @global.parent_centre </p>\n\n<p>Stacked with the resources you need whenever you want. </p>\n\n<p>Instant access to help sections with @global.essential_tools for each skill, extra information and local resources.</p>",
        "template_component_name": "tile_parent_centre",
        "route": "template/home_screen"
      },
      {
        "type": "step",
        "title": "Customise your @global.parent_app",
        "message_text": "<p>The round button appears whenever there is something ready for you to do.</p> \n\n<p>Click <img src=\"/assets/icon/round-button/message_2.svg\"> to customise your app experience </p>",
        "template_component_name": "tile_parent_centre",
        "route": "template/home_screen"
      },
      {
        "type": "step",
        "message_text": "<p>However you start, just the fact you are here shows you care.</p>",
        "route": "template/home_screen"
      }
    ],
    "_xlsxPath": "plh_sheets_beta/plh_templating/tutorials/tour.xlsx"
  }
]