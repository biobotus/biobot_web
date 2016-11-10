#!/usr/bin/python3
# -*- coding: utf-8 -*-

"""This file contains the JSON Schemas used for the protocol editor."""

def get_schema(value, conf, biobot):
    schema = {}

    if value == 'labware':
        labware_cursor = biobot.labware.find()
        labware = sorted([item['name'] for item in labware_cursor])
        schema = {
            'title': 'Labware',
            'type': 'array',
            'format': 'tabs',
            'maxItems': conf.max_labware_items,
            'uniqueItems': True,
            'items': {
                'title': 'Item',
                'headerTemplate': '{{self.name}} - {{self.id}}',
                'type': 'object',
                'properties': {
                    'name': {
                        'title': 'Category',
                        'type': 'string',
                        'enum': labware,
                        'propertyOrder': 1
                    },
                    'id': {
                        'title': 'Name',
                        'type': 'string',
                        'description': 'Name must not be empty',
                        'pattern': '^(?!\s*$).+',
                        'propertyOrder': 2
                    }
                }
            }
        }

    elif value == 'instructions':
        generated = 'This is automatically generated from the previous two fields'
        pattern_description = 'Must be one or two uppercase letter followed by one or two digit'

        from_dict = {
            'from_container': {
                'title': 'From (container)',
                'type': 'string',
                'pattern': '^(?!\s*$).+',
                'propertyOrder': 1
            },
            'from_location': {
                'title': 'From (location)',
                'type': 'string',
                'pattern': '^[A-Z]{1,2}[0-9]{1,2}$',
                'description': pattern_description,
                'propertyOrder': 2
            },
            'from': {
                'title': 'From',
                'type': 'string',
                'description': generated,
                'template': '{{f_con}}/{{f_loc}}',
                'watch': {
                    'f_con': 'id.from_container',
                    'f_loc': 'id.from_location'
                },
                'propertyOrder': 3
            }
        }

        to_dict = {
            'to_container': {
                'title': 'to (container)',
                'type': 'string',
                'pattern': '^(?!\s*$).+',
                'propertyOrder': 4
            },
            'to_location': {
                'title': 'to (location)',
                'type': 'string',
                'pattern': '^[A-Z]{1,2}[0-9]{1,2}$',
                'description': pattern_description,
                'propertyOrder': 5
            },
            'to': {
                'title': 'To',
                'type': 'string',
                'description': generated,
                'template': '{{t_con}}/{{t_loc}}',
                'watch': {
                    't_con': 'id.to_container',
                    't_loc': 'id.to_location'
                },
                'propertyOrder': 6
            }
        }

        volume_dict = {
            'volume': {
                'title': 'Volume (µL)',
                'type': 'number',
                'minimum': 0,
                'propertyOrder': 7
            }
        }

        iteration_dict = {
            'iteration': {
                'title': 'Iterations',
                'type': 'integer',
                'minimum': 1,
                'default': 1,
                'propertyOrder': 8
            }
        }

        mix_iteration_dict = {
            'mix_iteration': {
                'title': 'Mix iterations',
                'type': 'integer',
                'minimum': 1,
                'default': 1,
                'propertyOrder': 9
            }
        }

        aspirate_dict = {
            'aspirate_speed': {
                'title': 'Aspirate speed (µL/s)',
                'type': 'number',
                'minimum': 1,
                'default': conf.default_pipette_speed,
                'propertyOrder': 10
            }
        }

        dispense_dict = {
            'dispense_speed': {
                'title': 'Dispense speed (µL/s)',
                'type': 'number',
                'minimum': 1,
                'default': conf.default_pipette_speed,
                'propertyOrder': 11
            }
        }

        transfer = {
            'title': 'Transfer',
            'type': 'object',
            'id': 'id',
            'properties': {}
        }

        transfer_properties = [from_dict, to_dict, volume_dict, aspirate_dict, dispense_dict]
        for prop in transfer_properties:
            transfer['properties'].update(prop)

        mix = {
            'title': 'Mix',
            'type': 'object',
            'id': 'id',
            'properties': {}
        }

        mix_properties = [from_dict, volume_dict, iteration_dict, aspirate_dict, dispense_dict]
        for prop in mix_properties:
            mix['properties'].update(prop)

        serial_dilution = {
            'title': 'Serial dilution',
            'type': 'object',
            'id': 'id',
            'properties': {}
        }

        serial_dilution_properties = [from_dict, to_dict, volume_dict, iteration_dict, mix_iteration_dict, aspirate_dict, dispense_dict]
        for prop in serial_dilution_properties:
            serial_dilution['properties'].update(prop)

        multi_dispense = {
            'title': 'Multi dispense',
            'type': 'object',
            'id': 'id',
            'properties': {}
        }

        multi_dispense_properties = [from_dict, to_dict, volume_dict, iteration_dict, aspirate_dict, dispense_dict]
        for prop in multi_dispense_properties:
            multi_dispense['properties'].update(prop)

        pipette_groups = {
            'title': 'Actions',
            'type': 'array',
            'format': 'tabs',
            'maxItems': conf.max_actions_per_group,
            'items': {
                'title': 'Action',
                'type': 'object',
                'oneOf': [
                    {
                        'title': 'Transfer',
                        'properties': {
                            'transfer': transfer
                        },
                    },
                    {
                        'title': 'Mix',
                        'properties': {
                            'mix': mix
                        },
                    },
                    {
                        'title': 'Serial dilution',
                        'properties': {
                            'serial_dilution': serial_dilution
                        },
                    },
                    {
                        'title': 'Multi dispense',
                        'properties': {
                            'multi_dispense': multi_dispense
                        },
                    }
                ]
            }
        }

        pipette_s = {
            'title': 'Single Pipette',
            'properties': {
                'op': {
                    'title': 'Tool',
                    'type': 'string',
                    'enum': ['pipette_s'],
                    'propertyOrder': 1
                },
                'groups': pipette_groups
            }
        }

        pipette_m = {
            'title': 'Multiple Pipette',
            'properties': {
                'op': {
                    'title': 'Tool',
                    'type': 'string',
                    'enum': ['pipette_m'],
                    'propertyOrder': 1
                },
                'groups': pipette_groups
            }
        }

        schema = {
            'title': 'Instructions',
            'type': 'array',
            'format': 'tabs',
            'maxItems': conf.max_protocol_steps,
            'items': {
                'title': 'Step',
                'type': 'object',
                'headerTemplate': 'Step {{i}} - {{self.op}}',
                'anyOf': [
                    pipette_s,
                    pipette_m
                ]
            }
        }

    elif value == 'deck':
        deck_cursor = biobot.labware.find({'type': {'$ne': 'Tool'}})
        deck = sorted([item['name'] for item in deck_cursor])

        schema = {
            'title': 'Deck',
            'type': 'array',
            'format': 'tabs',
            'maxItems': conf.max_labware_items,
            'uniqueItems': True,
            'items': {
                'title': 'Item',
                'headerTemplate': '{{self.name}} ({{self.row}}{{self.col}})',
                'type': 'object',
                'properties': {
                    'name': {
                        'title': 'Type',
                        'type': 'string',
                        'enum': deck,
                        'propertyOrder': 1
                    },
                    'id': {
                        'title': 'ID/Name',
                        'type': 'string',
                        'description': 'Must not be empty',
                        'pattern': '^(?!\s*$).+',
                        'propertyOrder': 2
                    },
                    'row': {
                        'title': 'Location (row)',
                        'type': 'string',
                        'description': 'A-Z',
                        'pattern': '^[A-Z]{1}$',
                        'propertyOrder': 3
                    },
                    'col': {
                        'title': 'Location (column)',
                        'type': 'string',
                        'description': '0-99',
                        'pattern': '^[0-9]{1,2}$',
                        'propertyOrder': 4
                    }
                }
            }
        }

    return schema

