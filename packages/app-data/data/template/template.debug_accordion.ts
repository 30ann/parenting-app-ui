/* eslint-disable */
import { FlowTypes } from "data-models";
const template: FlowTypes.Template[] = [
  {
    flow_type: "template",
    flow_name: "example_accordion",
    status: "released",
    flow_subtype: "debug_accordion",
    rows: [
      {
        name: "title_1",
        value: "First title",
        _translations: {
          value: {},
        },
        type: "set_variable",
        _nested_name: "title_1",
      },
      {
        name: "text_1",
        value: "Text 1",
        _translations: {
          value: {},
        },
        type: "set_variable",
        _nested_name: "text_1",
      },
      {
        name: "title_2",
        value: "Second title",
        _translations: {
          value: {},
        },
        type: "set_variable",
        _nested_name: "title_2",
      },
      {
        name: "text_2",
        value: "Text 2",
        _translations: {
          value: {},
        },
        type: "set_variable",
        _nested_name: "text_2",
      },
      {
        name: "button_text_2",
        value: "Button text 2",
        _translations: {
          value: {},
        },
        type: "set_variable",
        _nested_name: "button_text_2",
      },
      {
        name: "title_3",
        value: "Third title",
        _translations: {
          value: {},
        },
        type: "set_variable",
        _nested_name: "title_3",
      },
      {
        name: "text_3",
        value: "Text 3",
        _translations: {
          value: {},
        },
        type: "set_variable",
        _nested_name: "text_3",
      },
      {
        type: "title",
        name: "section_1",
        value: "Example - open multiple, custom icon",
        _translations: {
          value: {},
        },
        _nested_name: "section_1",
      },
      {
        type: "accordion",
        name: "accordion",
        parameter_list: {
          open_icon_src: "add",
          close_icon_src: "remove",
          openMultiple: "true",
        },
        rows: [
          {
            type: "accordion_section",
            name: "first",
            value: "@local.title_1",
            parameter_list: {
              state: "open",
            },
            rows: [
              {
                type: "template",
                name: "template_1",
                value: "example_text",
                rows: [
                  {
                    name: "text",
                    value: "@local.text_1",
                    _translations: {
                      value: {},
                    },
                    type: "set_variable",
                    _nested_name: "accordion.first.template_1.text",
                    _dynamicFields: {
                      value: [
                        {
                          fullExpression: "@local.text_1",
                          matchedExpression: "@local.text_1",
                          type: "local",
                          fieldName: "text_1",
                        },
                      ],
                    },
                    _dynamicDependencies: {
                      "@local.text_1": ["value"],
                    },
                  },
                ],
                _nested_name: "accordion.first.template_1",
              },
            ],
            _nested_name: "accordion.first",
            _dynamicFields: {
              value: [
                {
                  fullExpression: "@local.title_1",
                  matchedExpression: "@local.title_1",
                  type: "local",
                  fieldName: "title_1",
                },
              ],
            },
            _dynamicDependencies: {
              "@local.title_1": ["value"],
            },
          },
          {
            type: "accordion_section",
            name: "second",
            value: "@local.title_2",
            rows: [
              {
                type: "template",
                name: "template_2",
                value: "example_text_button",
                rows: [
                  {
                    name: "text",
                    value: "@local.text_2",
                    _translations: {
                      value: {},
                    },
                    type: "set_variable",
                    _nested_name: "accordion.second.template_2.text",
                    _dynamicFields: {
                      value: [
                        {
                          fullExpression: "@local.text_2",
                          matchedExpression: "@local.text_2",
                          type: "local",
                          fieldName: "text_2",
                        },
                      ],
                    },
                    _dynamicDependencies: {
                      "@local.text_2": ["value"],
                    },
                  },
                  {
                    name: "button",
                    value: "@local.button_text_2",
                    _translations: {
                      value: {},
                    },
                    action_list: [
                      {
                        trigger: "click",
                        action_id: "pop_up",
                        args: ["example_text"],
                        _raw: "click | pop_up: example_text",
                        _cleaned: "click | pop_up: example_text",
                      },
                    ],
                    type: "set_variable",
                    _nested_name: "accordion.second.template_2.button",
                    _dynamicFields: {
                      value: [
                        {
                          fullExpression: "@local.button_text_2",
                          matchedExpression: "@local.button_text_2",
                          type: "local",
                          fieldName: "button_text_2",
                        },
                      ],
                    },
                    _dynamicDependencies: {
                      "@local.button_text_2": ["value"],
                    },
                  },
                ],
                _nested_name: "accordion.second.template_2",
              },
            ],
            _nested_name: "accordion.second",
            _dynamicFields: {
              value: [
                {
                  fullExpression: "@local.title_2",
                  matchedExpression: "@local.title_2",
                  type: "local",
                  fieldName: "title_2",
                },
              ],
            },
            _dynamicDependencies: {
              "@local.title_2": ["value"],
            },
          },
          {
            type: "accordion_section",
            name: "third",
            value: "@local.title_3",
            rows: [
              {
                type: "text",
                name: "text",
                value: "@local.text_3",
                _translations: {
                  value: {},
                },
                _nested_name: "accordion.third.text",
                _dynamicFields: {
                  value: [
                    {
                      fullExpression: "@local.text_3",
                      matchedExpression: "@local.text_3",
                      type: "local",
                      fieldName: "text_3",
                    },
                  ],
                },
                _dynamicDependencies: {
                  "@local.text_3": ["value"],
                },
              },
              {
                type: "image",
                name: "image",
                value: "plh_images/workshops/w_rules/read_1/slide_4.svg",
                _translations: {
                  value: {},
                },
                _nested_name: "accordion.third.image",
              },
            ],
            _nested_name: "accordion.third",
            _dynamicFields: {
              value: [
                {
                  fullExpression: "@local.title_3",
                  matchedExpression: "@local.title_3",
                  type: "local",
                  fieldName: "title_3",
                },
              ],
            },
            _dynamicDependencies: {
              "@local.title_3": ["value"],
            },
          },
        ],
        _nested_name: "accordion",
      },
      {
        type: "title",
        name: "section_2",
        value: "Example - default settings",
        _translations: {
          value: {},
        },
        _nested_name: "section_2",
      },
      {
        type: "accordion",
        name: "accordion",
        rows: [
          {
            type: "accordion_section",
            name: "first",
            value: "@local.title_1",
            rows: [
              {
                type: "template",
                name: "template_1",
                value: "example_text",
                rows: [
                  {
                    name: "text",
                    value: "@local.text_1",
                    _translations: {
                      value: {},
                    },
                    type: "set_variable",
                    _nested_name: "accordion.first.template_1.text",
                    _dynamicFields: {
                      value: [
                        {
                          fullExpression: "@local.text_1",
                          matchedExpression: "@local.text_1",
                          type: "local",
                          fieldName: "text_1",
                        },
                      ],
                    },
                    _dynamicDependencies: {
                      "@local.text_1": ["value"],
                    },
                  },
                ],
                _nested_name: "accordion.first.template_1",
              },
            ],
            _nested_name: "accordion.first",
            _dynamicFields: {
              value: [
                {
                  fullExpression: "@local.title_1",
                  matchedExpression: "@local.title_1",
                  type: "local",
                  fieldName: "title_1",
                },
              ],
            },
            _dynamicDependencies: {
              "@local.title_1": ["value"],
            },
          },
          {
            type: "accordion_section",
            name: "second",
            value: "@local.title_2",
            rows: [
              {
                type: "template",
                name: "template_2",
                value: "example_text_button",
                rows: [
                  {
                    name: "text",
                    value: "@local.text_2",
                    _translations: {
                      value: {},
                    },
                    type: "set_variable",
                    _nested_name: "accordion.second.template_2.text",
                    _dynamicFields: {
                      value: [
                        {
                          fullExpression: "@local.text_2",
                          matchedExpression: "@local.text_2",
                          type: "local",
                          fieldName: "text_2",
                        },
                      ],
                    },
                    _dynamicDependencies: {
                      "@local.text_2": ["value"],
                    },
                  },
                  {
                    name: "button",
                    value: "@local.button_text_2",
                    _translations: {
                      value: {},
                    },
                    action_list: [
                      {
                        trigger: "click",
                        action_id: "pop_up",
                        args: ["example_text"],
                        _raw: "click | pop_up: example_text",
                        _cleaned: "click | pop_up: example_text",
                      },
                    ],
                    type: "set_variable",
                    _nested_name: "accordion.second.template_2.button",
                    _dynamicFields: {
                      value: [
                        {
                          fullExpression: "@local.button_text_2",
                          matchedExpression: "@local.button_text_2",
                          type: "local",
                          fieldName: "button_text_2",
                        },
                      ],
                    },
                    _dynamicDependencies: {
                      "@local.button_text_2": ["value"],
                    },
                  },
                ],
                _nested_name: "accordion.second.template_2",
              },
            ],
            _nested_name: "accordion.second",
            _dynamicFields: {
              value: [
                {
                  fullExpression: "@local.title_2",
                  matchedExpression: "@local.title_2",
                  type: "local",
                  fieldName: "title_2",
                },
              ],
            },
            _dynamicDependencies: {
              "@local.title_2": ["value"],
            },
          },
          {
            type: "accordion_section",
            name: "third",
            value: "@local.title_3",
            rows: [
              {
                type: "text",
                name: "text",
                value: "@local.text_3",
                _translations: {
                  value: {},
                },
                _nested_name: "accordion.third.text",
                _dynamicFields: {
                  value: [
                    {
                      fullExpression: "@local.text_3",
                      matchedExpression: "@local.text_3",
                      type: "local",
                      fieldName: "text_3",
                    },
                  ],
                },
                _dynamicDependencies: {
                  "@local.text_3": ["value"],
                },
              },
              {
                type: "image",
                name: "image",
                value: "plh_images/workshops/w_rules/read_1/slide_4.svg",
                _translations: {
                  value: {},
                },
                _nested_name: "accordion.third.image",
              },
            ],
            _nested_name: "accordion.third",
            _dynamicFields: {
              value: [
                {
                  fullExpression: "@local.title_3",
                  matchedExpression: "@local.title_3",
                  type: "local",
                  fieldName: "title_3",
                },
              ],
            },
            _dynamicDependencies: {
              "@local.title_3": ["value"],
            },
          },
        ],
        _nested_name: "accordion",
      },
    ],
    _xlsxPath: "quality_assurance/example_templates/example_accordion.xlsx",
  },
];
export default template;
