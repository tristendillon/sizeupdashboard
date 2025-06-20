First Due REST API Documentation
On this page

## Schema

## Parameters

## HTTP Verbs

## Authentication

## API Methods

## Change Log:

# Fire Department REST API

## Schema

All API access is over HTTPS, and accessed through https://sizeup.firstduesizeup.com/fd-api/v1/. All data is sent and received as JSON.

All timestamps are returned in ISO 8601 format:

    YYYY-MM-DDTHH:MM:SSZ

## Parameters

For POST request, parameters not included in the URL should be encoded as JSON with a Content-Type of 'application/json'.

## Root Endpoint

    https://sizeup.firstduesizeup.com/fd-api/v1/

## HTTP Verbs

Where possible, API v1 strives to use appropriate HTTP verbs for each action.

| Verb  | Description                                                                                                                             |
| :---- | :-------------------------------------------------------------------------------------------------------------------------------------- |
| HEAD  | Used for retrieving headers.                                                                                                            |
| GET   | Used for retrieving resources.                                                                                                          |
| POST  | Used for creating resources, or performing custom actions.                                                                              |
| PATCH | Used for updating resources with partial JSON data. A PATCH request may accept one or more of the attributes to update the resource.    |
| PUT   | Used for replacing resources or collections. For PUT requests with no body attribute, be sure to set the Content-Length header to zero. |

## Authentication

Requests that require authentication will return 403 Forbidden.

### OAuth2 Token (sent in a header)

    $ curl -H "Authorization: Bearer OAUTH-TOKEN" https://sizeup.firstduesizeup.com/fd-api/v1/foo/bar

This should only be used in server to server scenarios. Don't leak your OAuth application's client secret to your users.

### Timezones

We use UTC as the timezone to create the item.

## API Methods

### POST /fd-api/v1/auth/token

Get an Access Token.

    POST /fd-api/v1/auth/token

#### Parameters

| Name       | Type   | Description                                   |
| :--------- | :----- | :-------------------------------------------- |
| email      | string | **Required**. Email                           |
| password   | string | **Required**. Password                        |
| grant_type | string | **Required**. Grant Type (client_credentials) |

#### Example Request

    $ curl -i -k -H "Content-Type: application/json" -X POST -d '{"grant_type": "client_credentials", "email": "user1@fdsu.tld", "password": "password1"}' https://sizeup.firstduesizeup.com/fd-api/v1/auth/token

#### Success Response

    HTTP/1.1 200 OK
    {
      "access_token": "AAJEdz1tzkHFn6b76rj9SPAmE4BDCxRI",
      "expires_in": 1209600,
      "scope": "api web",
      "token_type": "bearer"
    }

#### Error Response

    HTTP/1.1 401 Unauthorized
    {
      "code": 0,
      "message": "Incorrect email\/password combination."
    }

    HTTP/1.1 422 Unprocessable Entity
    {
      "code": 0,
      "message": "Validation Failed. Please provide grant_type parameter.",
      "errors": [
        {
          "field": "grant_type",
          "code": "missing_field",
          "message": "Please provide grant_type parameter."
        }
      ]
    }

### GET /fd-api/v1/dispatches

Get dispatches. Request will be paginated to 20 items by default.

    GET /fd-api/v1/dispatches

#### Parameters

| Name  | Type   | Description                                                                                         |
| :---- | :----- | :-------------------------------------------------------------------------------------------------- |
| page  | int    | Page number                                                                                         |
| since | string | Only dispatches created at or after this time are returned. This is a timestamp in ISO 8601 format. |

The [Link header](http://tools.ietf.org/html/rfc5988) includes pagination information:

    Link: <https://sizeup.firstduesizeup.com/fd-api/v1/dispatches?page=2>; rel="next",
      <https://sizeup.firstduesizeup.com/fd-api/v1/dispatches?page=7>; rel="last"

The possible `rel` values are:

| Name  | Description                                                   |
| :---- | :------------------------------------------------------------ |
| first | The link relation for the first page of results.              |
| prev  | The link relation for the immediate previous page of results. |
| next  | The link relation for the immediate next page of results.     |
| last  | The link relation for the last page of results.               |

#### Example Request

    $ curl -i -k -H "Authorization: Bearer 4cc212aac77dad9f9e1e5e2b2be5dd5a" -G --data-urlencode "since=2019-02-15T19:00:00+00:00" https://sizeup.firstduesizeup.com/fd-api/v1/dispatches

#### Success Response

    HTTP/1.1 200 OK
    Link: <https://sizeup.firstduesizeup.com/fd-api/v1/dispatches?page=2>; rel="next",
      <https://sizeup.firstduesizeup.com/fd-api/v1/dispatches?page=7>; rel="last"

    [
      {
        "id": 123,
        "type": "FD TYPE",
        "message": "FD MESSAGE"
        "address": "FD ADDRESS",
        "address2: "APT 123",
        "city": "FD CITY",
        "state_code": "WA",
        "latitude": 47.633523,
        "longitude": -122.277157,
        "unit_codes": ["U1"],
        "incident_type_code": "118CR",
        "status_code": "open",
        "xref_id": "FD_ID1",
        "created_at": "2019-02-16T19:42:00+00:00"
      },
      {
        ...
      }
    ]

#### Error Response

    HTTP/1.1 401 Unauthorized
    {
      "code": 0,
      "message": "Your request was made with invalid credentials."
    }

    HTTP/1.1 403 Forbidden
    {
      "code": 0,
      "message": "You are not authorized to perform this action."
    }

    HTTP/1.1 422 Unprocessable Entity
    {
      "code": 0,
      "message": "Validation Failed. Please provide a valid since parameter.",
      "errors": [
        {
          "field": "since",
          "code": "invalid",
          "message": "Please provide a date in ISO 8601 format."
        }
      ]
    }

### POST /fd-api/v1/dispatches

Create a dispatch.

    POST /fd-api/v1/dispatches

#### Parameters

| Name               | Type   | Description                       |
| :----------------- | :----- | :-------------------------------- |
| type               | string | **Required**. Type                |
| message            | string | Message                           |
| address            | string | **Required**. Address 1           |
| address2           | string | Address 2 (apt, unit, suite, etc) |
| city               | string | **Required**. City                |
| state_code         | string | **Required**. State Code          |
| latitude           | string | Latitude                          |
| longitude          | string | Longitude                         |
| unit_codes         | string | Unit Codes (comma separated)      |
| incident_type_code | string | Incident Type Code                |
| xref_id            | string | Xref Id                           |

#### Example Request

    $ curl -i -k -H "Authorization: Bearer 4cc212aac77dad9f9e1e5e2b2be5dd5a" -X POST -d '{"type": "TYPE", "message": "MESSAGE", "address": "ADDRESS", "address2": "APT 123", "city": "CITY", "state_code": "NY", "latitude": 40.0, "longitude": -120.0, "unit_codes": "U1,U2,U3", "incident_type_code": "118CR", "xref_id": "FD_ID1"}' https://sizeup.firstduesizeup.com/fd-api/v1/dispatches

#### Success Response

    HTTP/1.1 204 No Content

#### Error Response

    HTTP/1.1 401 Unauthorized
    {
      "code": 0,
      "message": "Your request was made with invalid credentials."
    }

    HTTP/1.1 403 Forbidden
    {
      "code": 0,
      "message": "You are not authorized to perform this action."
    }

    HTTP/1.1 409 Conflict
    {
      "code": 0,
      "message": "Object already exists."
    }

    HTTP/1.1 422 Unprocessable Entity
    {
      "code": 0,
      "message": "Validation Failed. Please provide address parameter.",
      "errors": [
        {
          "field": "address",
          "code": "missing_field",
          "message": "Please provide address parameter."
        }
      ]
    }

### PATCH /fd-api/v1/dispatches/xref/:xref_id

Update dispatch item.

    PATCH /fd-api/v1/dispatches/xref/:xref_id

#### Parameters

| Name               | Type   | Description                        |
| :----------------- | :----- | :--------------------------------- |
| type               | string | Type                               |
| message            | string | Message                            |
| address            | string | Address 1                          |
| address2           | string | Address 2 (apt, unit, suite, etc)  |
| city               | string | City                               |
| state_code         | string | State Code                         |
| latitude           | string | Latitude                           |
| longitude          | string | Longitude                          |
| unit_codes         | string | Unit Codes (comma separated)       |
| incident_type_code | string | Incident Type Code                 |
| status_code        | string | Status Code. (Valid codes: closed) |

#### Example Requests

    $ curl -i -k -H "Authorization: Bearer 4cc212aac77dad9f9e1e5e2b2be5dd5a" -X PATCH -d '{"status_code": "closed"}' https://sizeup.firstduesizeup.com/fd-api/v1/dispatches/xref/FD_ID1

#### Success Response

    HTTP/1.1 204 No Content

#### Error Response

    HTTP/1.1 401 Unauthorized
    {
      "code": 0,
      "message": "Your request was made with invalid credentials."
    }

    HTTP/1.1 403 Forbidden
    {
      "code": 0,
      "message": "The requested item does not exist or access denied."
    }

    HTTP/1.1 422 Unprocessable Entity
    {
      "code": 0,
      "message": "State is of the wrong length (should be 2 characters)."
    }

### PUT /fd-api/v1/dispatches/xref/:xref_id

Update dispatch item completely.

    PUT /fd-api/v1/dispatches/xref/:xref_id

#### Parameters

| Name               | Type   | Description                                            |
| :----------------- | :----- | :----------------------------------------------------- |
| type               | string | **Required**. Type                                     |
| message            | string | Message                                                |
| address            | string | **Required**. Address 1                                |
| address2           | string | Address 2 (apt, unit, suite, etc)                      |
| city               | string | **Required**. City                                     |
| state_code         | string | **Required**. State Code                               |
| latitude           | string | Latitude                                               |
| longitude          | string | Longitude                                              |
| unit_codes         | string | Unit Codes (comma separated)                           |
| incident_type_code | string | Incident Type Code                                     |
| status_code        | string | **Required**. Status Code. (Valid codes: open, closed) |

#### Example Requests

    $ curl -i -k -H "Authorization: Bearer 4cc212aac77dad9f9e1e5e2b2be5dd5a" -X PUT -d '{"type": "TYPE", "message": "MESSAGE", "address": "ADDRESS", "address2": "APT 123", "city": "CITY", "state_code": "NY", "latitude": 40.0, "longitude": -120.0, "unit_codes": "U1,U2,U3", "incident_type_code": "118CR", "status_code": "closed"}' https://sizeup.firstduesizeup.com/fd-api/v1/dispatches/xref/FD_ID1

#### Success Response

    HTTP/1.1 204 No Content

#### Error Response

    HTTP/1.1 401 Unauthorized
    {
      "code": 0,
      "message": "Your request was made with invalid credentials."
    }

    HTTP/1.1 403 Forbidden
    {
      "code": 0,
      "message": "The requested item does not exist or access denied."
    }

    HTTP/1.1 422 Unprocessable Entity
    {
      "code": 0,
      "message": "Validation Failed. Please provide address parameter.",
      "errors": [
        {
          "field": "address",
          "code": "missing_field",
          "message": "Please provide address parameter."
        }
      ]
    }

### DELETE /fd-api/v1/dispatches/xref/:xref_id

Delete dispatch item.

    DELETE /fd-api/v1/dispatches/xref/:xref_id

#### Parameters

| Name    | Type   | Description           |
| :------ | :----- | :-------------------- |
| xref_id | string | **Required**. Xref Id |

#### Example Requests

    $ curl -i -k -H "Authorization: Bearer 4cc212aac77dad9f9e1e5e2b2be5dd5a" -X DELETE https://sizeup.firstduesizeup.com/fd-api/v1/dispatches/xref/FD_ID1

#### Success Response

    HTTP/1.1 204 No Content

#### Error Response

    HTTP/1.1 401 Unauthorized
    {
      "code": 0,
      "message": "Your request was made with invalid credentials."
    }

    HTTP/1.1 403 Forbidden
    {
      "code": 0,
      "message": "The requested item does not exist or access denied."
    }

### HEAD /fd-api/v1/iams/email/:email

Check that IAMS authentication is enabled for the email.

    HEAD /fd-api/v1/iams/email/:email

#### Parameters

| Name  | Type   | Description         |
| :---- | :----- | :------------------ |
| email | string | **Required**. Email |

#### Example Request

    $ curl -i -k -I -H "Authorization: Bearer 4cc212aac77dad9f9e1e5e2b2be5dd5a" https://sizeup.firstduesizeup.com/fd-api/v1/iams/email/test@test.com

#### Success Response

    HTTP/1.1 200 OK

#### Error Response

    HTTP/1.1 401 Unauthorized
    {
      "code": 0,
      "message": "Your request was made with invalid credentials."
    }

    HTTP/1.1 403 Forbidden
    {
      "code": 0,
      "message": "The requested item does not exist or access denied."
    }

### GET /fd-api/v1/tce-premises/xref/:premise_id

Get a TCE premise.

    GET /fd-api/v1/tce-premises/xref/:premise_id

#### Parameters

| Name       | Type | Description              |
| :--------- | :--- | :----------------------- |
| premise_id | int  | **Required**. Premise Id |

#### Example Request

    $ curl -i -k -H "Authorization: Bearer 4cc212aac77dad9f9e1e5e2b2be5dd5a" https://sizeup.firstduesizeup.com/fd-api/v1/tce-premises/xref/111

#### Success Response

    HTTP/1.1 200 OK
    {
      "name": "The vault",
      "address1": "ADDRESS",
      "address2": "APT 25",
      "city": "CITY",
      "state_code": "WA",
      "zip": "12345",
      "latitude": 40,
      "longitude": -120,
      "status_code": "INACTIVE",
      "tag_color_code": null
    }

#### Error Response

    HTTP/1.1 401 Unauthorized
    {
      "code": 0,
      "message": "Your request was made with invalid credentials."
    }

    HTTP/1.1 403 Forbidden
    {
      "code": 0,
      "message": "You are not authorized to perform this action."
    }

### POST /fd-api/v1/tce-premises

Create a TCE premise.

    POST /fd-api/v1/tce-premises

#### Parameters

| Name           | Type   | Description                                           |
| :------------- | :----- | :---------------------------------------------------- |
| premise_id     | int    | **Required**. Premise Id                              |
| name           | string | Premise name                                          |
| address1       | string | **Required**. Address 1                               |
| address2       | string | Address 2 (apt, unit, suite, etc)                     |
| city           | string | **Required**. City                                    |
| state_code     | string | **Required**. State code                              |
| zip            | string | **Required**. Postal zip code                         |
| latitude       | string | Latitude                                              |
| longitude      | string | Longitude                                             |
| status_code    | string | **Required**. Status code (ACTIVE, INACTIVE, DELETED) |
| tag_color_code | string | Tag color code (BLUE, GREEN, RED, WHITE, YELLOW)      |

#### Example Request

    $ curl -i -k -H "Authorization: Bearer 4cc212aac77dad9f9e1e5e2b2be5dd5a" -X POST -d '{"premise_id": 111, "name": "The vault", "address1": "ADDRESS", "address2": "APT 25", "city": "CITY", "state_code": "WA", "zip": "12345", "latitude": 40.0, "longitude": -120.0, "status_code": "ACTIVE"}' https://sizeup.firstduesizeup.com/fd-api/v1/tce-premises

#### Success Response

    HTTP/1.1 204 No Content

#### Error Response

    HTTP/1.1 401 Unauthorized
    {
      "code": 0,
      "message": "Your request was made with invalid credentials."
    }

    HTTP/1.1 403 Forbidden
    {
      "code": 0,
      "message": "You are not authorized to perform this action."
    }

    HTTP/1.1 409 Conflict
    {
      "code": 0,
      "message": "Object already exists."
    }

    HTTP/1.1 422 Unprocessable Entity
    {
      "code": 0,
      "message": "Validation Failed. Please provide address parameter.",
      "errors": [
        {
          "field": "address",
          "code": "missing_field",
          "message": "Please provide address parameter."
        }
      ]
    }

### PATCH /fd-api/v1/tce-premises/xref/:premise_id

Update a TCE premise.

    PATCH /fd-api/v1/tce-premises/xref/:premise_id

#### Parameters

| Name           | Type   | Description                                      |
| :------------- | :----- | :----------------------------------------------- |
| name           | string | Premise name                                     |
| address1       | string | Address 1                                        |
| address2       | string | Address 2 (apt, unit, suite, etc)                |
| city           | string | City                                             |
| state_code     | string | State Code                                       |
| zip            | string | Postal zip code                                  |
| latitude       | string | Latitude                                         |
| longitude      | string | Longitude                                        |
| status_code    | string | Status code (ACTIVE, INACTIVE, DELETED)          |
| tag_color_code | string | Tag color code (BLUE, GREEN, RED, WHITE, YELLOW) |

#### Example Requests

    $ curl -i -k -H "Authorization: Bearer 4cc212aac77dad9f9e1e5e2b2be5dd5a" -X PATCH -d '{"status_code": "INACTIVE"}' https://sizeup.firstduesizeup.com/fd-api/v1/tce-premises/xref/111

#### Success Response

    HTTP/1.1 204 No Content

#### Error Response

    HTTP/1.1 401 Unauthorized
    {
      "code": 0,
      "message": "Your request was made with invalid credentials."
    }

    HTTP/1.1 403 Forbidden
    {
      "code": 0,
      "message": "The requested item does not exist or access denied."
    }

    HTTP/1.1 422 Unprocessable Entity
    {
      "code": 0,
      "message": "State is of the wrong length (should be 2 characters)."
    }

### GET /fd-api/v1/tce-systems/xref/:system_id

Get a TCE system.

    GET /fd-api/v1/tce-systems/xref/:system_id

#### Parameters

| Name      | Type | Description             |
| :-------- | :--- | :---------------------- |
| system_id | int  | **Required**. System Id |

#### Example Request

    $ curl -i -k -H "Authorization: Bearer 4cc212aac77dad9f9e1e5e2b2be5dd5a" https://sizeup.firstduesizeup.com/fd-api/v1/tce-systems/xref/222

#### Success Response

    HTTP/1.1 200 OK
    {
      "premise_id": 111,
      "system_type_name": "Standpipe",
      "last_inspection_date": "2019-09-08",
      "next_inspection_date": "2020-09-10",
      "has_open_deficiencies": true,
      "status_code": "ACTIVE",
      "tag_color_code": "RED",
      "is_current": true,
      "is_inventory_tracked": false,
      "max_inventory_count": null,
      "is_service_dates_based_on_inventory": false
    }

#### Error Response

    HTTP/1.1 401 Unauthorized
    {
      "code": 0,
      "message": "Your request was made with invalid credentials."
    }

    HTTP/1.1 403 Forbidden
    {
      "code": 0,
      "message": "You are not authorized to perform this action."
    }

### POST /fd-api/v1/tce-systems

Create a TCE system.

    POST /fd-api/v1/tce-systems

#### Parameters

| Name                                | Type   | Description                                                                    |
| :---------------------------------- | :----- | :----------------------------------------------------------------------------- |
| system_id                           | int    | **Required**. Premise profile Id                                               |
| premise_id                          | int    | **Required**. Premise Id                                                       |
| system_type_name                    | string | **Required**. Master inspection report type name                               |
| last_inspection_date                | string | Last inspection date. ISO 8601 extended date format (Y YYY-MM-DD)              |
| next_inspection_date                | string | **Required**. Next inspection date. ISO 8601 extended date format (YYYY-MM-DD) |
| has_open_deficiencies               | bool   | **Required**. Has open deficiencies                                            |
| status_code                         | string | **Required**. Status code (ACTIVE, INACTIVE, DELETED)                          |
| tag_color_code                      | string | Tag color code (BLUE, GREEN, RED, WHITE, YELLOW)                               |
| is_current                          | bool   | Is current system                                                              |
| is_inventory_tracked                | bool   | Is inventory tracked                                                           |
| max_inventory_count                 | int    | Max inventory count                                                            |
| is_service_dates_based_on_inventory | bool   | Is service dates based on inventory                                            |

#### Example Request

    $ curl -i -k -H "Authorization: Bearer 4cc212aac77dad9f9e1e5e2b2be5dd5a" -X POST -d '{"system_id": 222, "premise_id": 111, "system_type_name": "Standpipe", "last_inspection_date": "2019-09-08", "next_inspection_date": "2020-09-09", "has_open_deficiencies": true, "status_code": "ACTIVE", "is_inventory_tracked": false, "max_inventory_count": 0, "is_service_dates_based_on_inventory": false}' https://sizeup.firstduesizeup.com/fd-api/v1/tce-systems

#### Success Response

    HTTP/1.1 204 No Content

#### Error Response

    HTTP/1.1 401 Unauthorized
    {
      "code": 0,
      "message": "Your request was made with invalid credentials."
    }

    HTTP/1.1 403 Forbidden
    {
      "code": 0,
      "message": "You are not authorized to perform this action."
    }

    HTTP/1.1 409 Conflict
    {
      "code": 0,
      "message": "Object already exists."
    }

    HTTP/1.1 422 Unprocessable Entity
    {
      "code": 0,
      "message": "Validation Failed. Please provide system_id parameter."
    }

### PATCH /fd-api/v1/tce-systems/xref/:system_id

Update a TCE system.

    PATCH /fd-api/v1/tce-systems/xref/:system_id

#### Parameters

| Name                                | Type   | Description                                                       |
| :---------------------------------- | :----- | :---------------------------------------------------------------- |
| premise_id                          | int    | Premise Id                                                        |
| system_type_name                    | string | Master inspection report type name                                |
| last_inspection_date                | string | Last inspection date. ISO 8601 extended date format (Y YYY-MM-DD) |
| next_inspection_date                | string | Next inspection date. ISO 8601 extended date format (YYYY-MM-DD)  |
| has_open_deficiencies               | bool   | Has open deficiencies                                             |
| status_code                         | string | Status code (ACTIVE, INACTIVE, DELETED)                           |
| tag_color_code                      | string | Tag color code (BLUE, GREEN, RED, WHITE, YELLOW)                  |
| is_current                          | bool   | Is current system                                                 |
| is_inventory_tracked                | bool   | Is inventory tracked                                              |
| max_inventory_count                 | int    | Max inventory count                                               |
| is_service_dates_based_on_inventory | bool   | Is service dates based on inventory                               |

#### Example Requests

    $ curl -i -k -H "Authorization: Bearer 4cc212aac77dad9f9e1e5e2b2be5dd5a" -X PATCH -d '{"next_inspection_date": "2020-09-10"}' https://sizeup.firstduesizeup.com/fd-api/v1/tce-systems/xref/222

#### Success Response

    HTTP/1.1 204 No Content

#### Error Response

    HTTP/1.1 401 Unauthorized
    {
      "code": 0,
      "message": "Your request was made with invalid credentials."
    }

    HTTP/1.1 403 Forbidden
    {
      "code": 0,
      "message": "The requested item does not exist or access denied."
    }

    HTTP/1.1 422 Unprocessable Entity
    {
      "code": 0,
      "message": "Please enter valid next inspection date."
    }

### GET /fd-api/v1/tce-inventories/xref/:inventory_id

Get a TCE inventory.

    GET /fd-api/v1/tce-inventories/xref/:inventory_id

#### Parameters

| Name         | Type | Description                |
| :----------- | :--- | :------------------------- |
| inventory_id | int  | **Required**. Inventory Id |

#### Example Request

    $ curl -i -k -H "Authorization: Bearer 4cc212aac77dad9f9e1e5e2b2be5dd5a" https://sizeup.firstduesizeup.com/fd-api/v1/tce-inventories/xref/333

#### Success Response

    HTTP/1.1 200 OK
    {
      "premise_id": 111,
      "system_id": 222,
      "system_type_name": "Elevator",
      "last_inspection_date": null,
      "next_inspection_date": "2020-09-07",
      "has_open_deficiencies": false,
      "description": "SW Tower Car 2",
      "status_code": "INACTIVE",
      "tag_color_code": "YELLOW",
      "is_current": false
    }

#### Error Response

    HTTP/1.1 401 Unauthorized
    {
      "code": 0,
      "message": "Your request was made with invalid credentials."
    }

    HTTP/1.1 403 Forbidden
    {
      "code": 0,
      "message": "You are not authorized to perform this action."
    }

### POST /fd-api/v1/tce-inventories

Create a TCE inventory.

    POST /fd-api/v1/tce-inventories

#### Parameters

| Name                  | Type   | Description                                                                    |
| :-------------------- | :----- | :----------------------------------------------------------------------------- |
| inventory_id          | int    | **Required**. Inventory Id                                                     |
| premise_id            | int    | **Required**. Premise Id                                                       |
| system_id             | int    | Premise profile Id                                                             |
| system_type_name      | string | **Required**. Master inspection report type name                               |
| last_inspection_date  | string | Last inspection date. ISO 8601 extended date format (YYYY-MM-DD)               |
| next_inspection_date  | string | **Required**. Next inspection date. ISO 8601 extended date format (YYYY-MM-DD) |
| has_open_deficiencies | bool   | **Required**. Has open deficiencies                                            |
| description           | string | Description                                                                    |
| status_code           | string | **Required**. Status code (ACTIVE, INACTIVE, DELETED)                          |
| tag_color_code        | string | Tag color code (BLUE, GREEN, RED, WHITE, YELLOW)                               |
| is_current            | bool   | Is current inventory                                                           |

#### Example Request

    $ curl -i -k -H "Authorization: Bearer 4cc212aac77dad9f9e1e5e2b2be5dd5a" -X POST -d '{"inventory_id": 333, "premise_id": 111, "system_id": 222, "system_type_name": "Elevator", "next_inspection_date": "2020-09-07", "has_open_deficiencies": false, "description": "SW Tower Car 2", "status_code": "ACTIVE", "tag_color_code": "RED"}' https://sizeup.firstduesizeup.com/fd-api/v1/tce-inventories

#### Success Response

    HTTP/1.1 204 No Content

#### Error Response

    HTTP/1.1 401 Unauthorized
    {
      "code": 0,
      "message": "Your request was made with invalid credentials."
    }

    HTTP/1.1 403 Forbidden
    {
      "code": 0,
      "message": "You are not authorized to perform this action."
    }

    HTTP/1.1 409 Conflict
    {
      "code": 0,
      "message": "Object already exists."
    }

    HTTP/1.1 422 Unprocessable Entity
    {
      "code": 0,
      "message": "Validation Failed. Please provide system_id parameter."
    }

### PATCH /fd-api/v1/tce-inventories/xref/:inventory_id

Update a TCE inventory.

    PATCH /fd-api/v1/tce-inventories/xref/:inventory_id

#### Parameters

| Name                  | Type   | Description                                                       |
| :-------------------- | :----- | :---------------------------------------------------------------- |
| premise_id            | int    | Premise Id                                                        |
| system_id             | int    | Premise profile Id                                                |
| system_type_name      | string | Master inspection report type name                                |
| last_inspection_date  | string | Last inspection date. ISO 8601 extended date format (Y YYY-MM-DD) |
| next_inspection_date  | string | Next inspection date. ISO 8601 extended date format (YYYY-MM-DD)  |
| has_open_deficiencies | bool   | Has open deficiencies                                             |
| description           | string | Description                                                       |
| status_code           | string | Status code (ACTIVE, INACTIVE, DELETED)                           |
| tag_color_code        | string | Tag color code (BLUE, GREEN, RED, WHITE, YELLOW)                  |
| is_current            | bool   | Is current inventory                                              |

#### Example Requests

    $ curl -i -k -H "Authorization: Bearer 4cc212aac77dad9f9e1e5e2b2be5dd5a" -X PATCH -d '{"has_open_deficiencies": false, "status_code": "INACTIVE", "tag_color_code": "YELLOW"}' https://sizeup.firstduesizeup.com/fd-api/v1/tce-inventories/xref/333

#### Success Response

    HTTP/1.1 204 No Content

#### Error Response

    HTTP/1.1 401 Unauthorized
    {
      "code": 0,
      "message": "Your request was made with invalid credentials."
    }

    HTTP/1.1 403 Forbidden
    {
      "code": 0,
      "message": "The requested item does not exist or access denied."
    }

    HTTP/1.1 422 Unprocessable Entity
    {
      "code": 0,
      "message": "Please enter valid status code."
    }

### GET /fd-api/v1/preplans/units/caution-notes

Get list of Caution Notes.

    GET /fd-api/v1/preplans/units/caution-notes

#### Parameters

| Name | Type | Description |
| :--- | :--- | :---------- |
| page | int  | Page number |

The [Link header](http://tools.ietf.org/html/rfc5988) includes pagination information:

    Link: <https://sizeup.firstduesizeup.com/fd-api/v1/preplans/units/caution-notes?page=2>; rel="next",
      <https://sizeup.firstduesizeup.com/fd-api/v1/preplans/units/caution-notes?page=7>; rel="last"

The possible `rel` values are:

| Name  | Description                                                   |
| :---- | :------------------------------------------------------------ |
| first | The link relation for the first page of results.              |
| prev  | The link relation for the immediate previous page of results. |
| next  | The link relation for the immediate next page of results.     |
| last  | The link relation for the last page of results.               |

#### Example Request

    $ curl -i -k -H "Authorization: Bearer 4cc212aac77dad9f9e1e5e2b2be5dd5a" -G --data-urlencode "page=2" https://sizeup.firstduesizeup.com/fd-api/v1/preplans/units/caution-notes

#### Success Response

    HTTP/1.1 200 OK
    Link: <https://sizeup.firstduesizeup.com/fd-api/v1/preplans/units/caution-notes?page=3>; rel="next",
      <https://sizeup.firstduesizeup.com/fd-api/v1/preplans/units/caution-notes?page=7>; rel="last"

    [
      {
        "xref_id": "123"
      },
      {
        "xref_id": "456"
      }
    ]

#### Error Response

    HTTP/1.1 401 Unauthorized
    {
      "code": 0,
      "message": "Your request was made with invalid credentials."
    }

    HTTP/1.1 403 Forbidden
    {
      "code": 0,
      "message": "You are not authorized to perform this action."
    }

### POST /fd-api/v1/preplans/units/caution-notes

Import a bunch of caution notes as preplan units. This will create or update every single record.
The response objects are returned in the order in which the caution notes were specified.

    POST /fd-api/v1/preplans/units/caution-notes

#### Parameters is an array of objects. Max size is 1000 items.

| Name          | Type   | Description                                    |
| :------------ | :----- | :--------------------------------------------- |
| xref_id       | number | **Required**. Xref Id                          |
| address       | string | **Required**. Address 1                        |
| apt           | string | Address 2                                      |
| city          | string | **Required**. City                             |
| state_code    | string | **Required**. State Code                       |
| notes         | string | **Required**. Caution Notes                    |
| category_code | string | Category Code. Can be INFO, CAUTION or DANGER. |
| priority_code | string | Priority Code. Can be HIGH, MEDIUM or LOW.     |
| from_date     | string | Valid From Date in ISO 8601 format             |
| to_date       | string | Valid To Date in ISO 8601 format               |

#### Example Request

    $ curl -i -k -H "Authorization: Bearer 4cc212aac77dad9f9e1e5e2b2be5dd5a" -X POST -d '[{"xref_id": 1, "address": "123 ADDRESS", "apt": "33A", "city": "CITY", "state_code": "NY", "notes": "CAUTION NOTES", "category_code": "INFO", "from_date": "2019-02-16", "to_date": "2029-02-16"}]' https://sizeup.firstduesizeup.com/fd-api/v1/preplans/units/caution-notes

#### Success Response

    HTTP/1.1 200 OK
    [
      {
        "success": true,
        "errors": []
      },
      {
        "success": false,
        "errors": ["Please provide address parameter."]
      }
    ]

#### Error Response

    HTTP/1.1 401 Unauthorized
    {
      "code": 0,
      "message": "Your request was made with invalid credentials."
    }

    HTTP/1.1 403 Forbidden
    {
      "code": 0,
      "message": "You are not authorized to perform this action."
    }

    HTTP/1.1 422 Unprocessable Entity
    {
      "code": 0,
      "message": "Validation Failed. Max items allowed exceeded.",
      "errors": []
    }

    HTTP/1.1 422 Unprocessable Entity
    {
      "code": 0,
      "message": Validation Failed. Empty parameters.",
      "errors": []
    }

### DELETE /fd-api/v1/preplans/units/caution-notes

Delete a bunch of Caution Notes by Xref ID

    DELETE /fd-api/v1/preplans/units/caution-notes

#### Parameters

| Name     | Type   | Description                                            |
| :------- | :----- | :----------------------------------------------------- |
| xref_ids | string | **Required**. Xref Ids. Max length allowed: 200 items. |

#### Example Request

    $ curl -i -k -H "Authorization: Bearer 4cc212aac77dad9f9e1e5e2b2be5dd5a" -X DELETE https://sizeup.firstduesizeup.com/fd-api/v1/preplans/units/caution-notes?xref_ids=1,2,3

#### Success Response

    HTTP/1.1 200 OK
    [
      {
        "xref_id": "1",
        "success": true,
        "errors": []
      },
      {
        "xref_id": "222",
        "success": false,
        "errors": ["Please provide valid Xref Id."]
      }
    ]

#### Error Response

    HTTP/1.1 401 Unauthorized
    {
      "code": 0,
      "message": "Your request was made with invalid credentials."
    }

    HTTP/1.1 403 Forbidden
    {
      "code": 0,
      "message": "You are not authorized to perform this action."
    }

    HTTP/1.1 422 Unprocessable Entity
    {
      "code": 0,
      "message": "Validation Failed. Max items allowed exceeded.",
      "errors": []
    }

    HTTP/1.1 422 Unprocessable Entity
    {
      "code": 0,
      "message": Validation Failed. Empty parameters.",
      "errors": []
    }

### GET /fd-api/v1/nfirs-notifications/:id

Get a NFIRS notification.

    GET /fd-api/v1/nfirs-notifications/:id

#### Parameters

| Name | Type | Description      |
| :--- | :--- | :--------------- |
| id   | int  | **Required**. Id |

#### Example Request

    $ curl -i -k -H "Authorization: Bearer 4cc212aac77dad9f9e1e5e2b2be5dd5a" https://sizeup.firstduesizeup.com/fd-api/v1/nfirs-notifications/111

#### Success Response

    HTTP/1.1 200 OK
    {
      "id": 111,
      "dispatch_number": "DN-01",
      "incident_number": "2021-00001",
      "dispatch_type": "DISPATCH_TYPE",
      "dispatch_incident_type_code": "118CR",
      "alarm_at": "2019-02-16T19:42:00+00:004",
      "dispatch_notified_at": "2019-02-16T19:42:00+00:004",
      "alarms": 3,
      "place_name": "PLACE_NAME",
      "location_info": "LOCATION_INFO",
      "venue": "VENUE",
      "address": "ADDRESS",
      "unit": "APT 123",
      "cross_streets": "CROSS_STREETS",
      "city": "CITY",
      "state_code": "NY",
      "latitude": 40.0,
      "longitude": -120.0,
      "narratives": "NARRATIVES",
      "shift_name": "SHIFT_NAME",
      "notification_type": "NOTIFICATION_TYPE"
    }

#### Error Response

    HTTP/1.1 401 Unauthorized
    {
      "code": 0,
      "message": "Your request was made with invalid credentials."
    }

    HTTP/1.1 403 Forbidden
    {
      "code": 0,
      "message": "You are not authorized to perform this action."
    }

### POST /fd-api/v1/nfirs-notifications

Create a NFIRS notification.

    POST /fd-api/v1/nfirs-notifications

#### Parameters

| Name                        | Type    | Description                                                               |
| :-------------------------- | :------ | :------------------------------------------------------------------------ |
| dispatch_number             | string  | Dispatch Number                                                           |
| incident_number             | string  | Incident Number                                                           |
| dispatch_type               | string  | **Required**. Dispatch Type                                               |
| dispatch_incident_type_code | string  | Dispatch Incident Type Code                                               |
| alarm_at                    | string  | Alarm At. ISO 8601 formatted datetime (YYYY-MM-DDTHH:MM:SS:Z)             |
| dispatch_notified_at        | string  | Dispatch Notified At. ISO 8601 formatted datetime (YYYY-MM-DDTHH:MM:SS:Z) |
| alarms                      | int     | Alarms                                                                    |
| place_name                  | string  | Place Name                                                                |
| location_info               | string  | Location Info                                                             |
| venue                       | string  | Venue                                                                     |
| address                     | string  | **Required**. Address                                                     |
| unit                        | string  | Unit                                                                      |
| cross_streets               | string  | Cross Streets                                                             |
| city                        | string  | **Required**. City                                                        |
| state_code                  | string  | **Required**. State Code                                                  |
| latitude                    | numeric | Latitude                                                                  |
| longitude                   | numeric | Longitude                                                                 |
| narratives                  | string  | Narratives                                                                |
| shift_name                  | string  | Shift Name                                                                |
| notification_type           | string  | Notification Type                                                         |

#### Example Request

    $ curl -i -k -H "Authorization: Bearer 4cc212aac77dad9f9e1e5e2b2be5dd5a" -X POST -d '{"dispatch_number": "DN-01", "incident_number": "2021-00001", "dispatch_type": "DISPATCH_TYPE", "dispatch_incident_type_code": "118CR", "alarm_at": "2019-02-16T19:42:00+00:004", "dispatch_notified_at": "2019-02-16T19:42:00+00:004", "alarms": 3, "place_name": "PLACE_NAME", "location_info": "LOCATION_INFO", "venue": "VENUE", "address": "ADDRESS", "unit": "APT 123", "cross_streets": "CROSS_STREETS", "city": "CITY", "state_code": "NY", "latitude": 40.0, "longitude": -120.0, "narratives": "NARRATIVES", "shift_name": "SHIFT_NAME", "notification_type": "NOTIFICATION_TYPE"}' https://sizeup.firstduesizeup.com/fd-api/v1/nfirs-notifications

#### Success Response

    HTTP/1.1 201 Created
    {
      "id": 111
    }

#### Error Response

    HTTP/1.1 401 Unauthorized
    {
      "code": 0,
      "message": "Your request was made with invalid credentials."
    }

    HTTP/1.1 403 Forbidden
    {
      "code": 0,
      "message": "You are not authorized to perform this action."
    }

    HTTP/1.1 409 Conflict
    {
      "code": 0,
      "message": "Object already exists."
    }

    HTTP/1.1 422 Unprocessable Entity
    {
      "code": 0,
      "message": "Validation Failed. Please provide address parameter.",
      "errors": [
        {
          "field": "address",
          "code": "missing_field",
          "message": "Please provide address parameter."
        }
      ]
    }

### PUT /fd-api/v1/nfirs-notifications/:id

Update NFIRS notification item completely.

    PUT /fd-api/v1/nfirs-notifications/:id

#### Parameters

| Name                        | Type    | Description                                                               |
| :-------------------------- | :------ | :------------------------------------------------------------------------ |
| dispatch_number             | string  | Dispatch Number                                                           |
| incident_number             | string  | Incident Number                                                           |
| dispatch_type               | string  | **Required**. Dispatch Type                                               |
| dispatch_incident_type_code | string  | Dispatch Incident Type Code                                               |
| alarm_at                    | string  | Alarm At. ISO 8601 formatted datetime (YYYY-MM-DDTHH:MM:SS:Z)             |
| dispatch_notified_at        | string  | Dispatch Notified At. ISO 8601 formatted datetime (YYYY-MM-DDTHH:MM:SS:Z) |
| alarms                      | int     | Alarms                                                                    |
| place_name                  | string  | Place Name                                                                |
| location_info               | string  | Location Info                                                             |
| venue                       | string  | Venue                                                                     |
| address                     | string  | **Required**. Address                                                     |
| unit                        | string  | Unit                                                                      |
| cross_streets               | string  | Cross Streets                                                             |
| city                        | string  | **Required**. City                                                        |
| state_code                  | string  | **Required**. State Code                                                  |
| latitude                    | numeric | Latitude                                                                  |
| longitude                   | numeric | Longitude                                                                 |
| narratives                  | string  | Narratives                                                                |
| shift_name                  | string  | Shift Name                                                                |
| notification_type           | string  | Notification Type                                                         |

#### Example Request

    $ curl -i -k -H "Authorization: Bearer 4cc212aac77dad9f9e1e5e2b2be5dd5a" -X PUT -d '{"dispatch_number": "DN-01", "incident_number": "2021-00001", "dispatch_type": "DISPATCH_TYPE", "dispatch_incident_type_code": "118CR", "alarm_at": "2019-02-16T19:42:00+00:004", "dispatch_notified_at": "2019-02-16T19:42:00+00:004", "alarms": 3, "place_name": "PLACE_NAME", "location_info": "LOCATION_INFO", "venue": "VENUE", "address": "ADDRESS", "unit": "APT 123", "cross_streets": "CROSS_STREETS", "city": "CITY", "state_code": "NY", "latitude": 40.0, "longitude": -120.0, "narratives": "NARRATIVES", "shift_name": "SHIFT_NAME", "notification_type": "NOTIFICATION_TYPE"}' https://sizeup.firstduesizeup.com/fd-api/v1/nfirs-notifications/24

#### Success Response

    HTTP/1.1 204 No Content

#### Error Response

    HTTP/1.1 401 Unauthorized
    {
      "code": 0,
      "message": "Your request was made with invalid credentials."
    }

    HTTP/1.1 403 Forbidden
    {
      "code": 0,
      "message": "You are not authorized to perform this action."
    }

    HTTP/1.1 403 Forbidden
    {
      "code": 0,
      "message": "The requested item does not exist or access denied."
    }

    HTTP/1.1 422 Unprocessable Entity
    {
      "code": 0,
      "message": "Validation Failed. Please provide address parameter.",
      "errors": [
        {
          "field": "address",
          "code": "missing_field",
          "message": "Please provide address parameter."
        }
      ]
    }

### PUT /fd-api/v1/nfirs-notifications/number/:incident_number

Update NFIRS notification item completely.

    PUT /fd-api/v1/nfirs-notifications/number/:incident_number

#### Parameters

| Name                        | Type    | Description                                                               |
| :-------------------------- | :------ | :------------------------------------------------------------------------ |
| dispatch_number             | string  | Dispatch Number                                                           |
| dispatch_type               | string  | **Required**. Dispatch Type                                               |
| dispatch_incident_type_code | string  | Dispatch Incident Type Code                                               |
| alarm_at                    | string  | Alarm At. ISO 8601 formatted datetime (YYYY-MM-DDTHH:MM:SS:Z)             |
| dispatch_notified_at        | string  | Dispatch Notified At. ISO 8601 formatted datetime (YYYY-MM-DDTHH:MM:SS:Z) |
| alarms                      | int     | Alarms                                                                    |
| place_name                  | string  | Place Name                                                                |
| location_info               | string  | Location Info                                                             |
| venue                       | string  | Venue                                                                     |
| address                     | string  | **Required**. Address                                                     |
| unit                        | string  | Unit                                                                      |
| cross_streets               | string  | Cross Streets                                                             |
| city                        | string  | **Required**. City                                                        |
| state_code                  | string  | **Required**. State Code                                                  |
| latitude                    | numeric | Latitude                                                                  |
| longitude                   | numeric | Longitude                                                                 |
| narratives                  | string  | Narratives                                                                |
| shift_name                  | string  | Shift Name                                                                |
| notification_type           | string  | Notification Type                                                         |

#### Example Request

    $ curl -i -k -H "Authorization: Bearer 4cc212aac77dad9f9e1e5e2b2be5dd5a" -X PUT -d '{"dispatch_number": "DN-01", "dispatch_type": "DISPATCH_TYPE", "dispatch_incident_type_code": "118CR", "alarm_at": "2019-02-16T19:42:00+00:004", "dispatch_notified_at": "2019-02-16T19:42:00+00:004", "alarms": 3, "place_name": "PLACE_NAME", "location_info": "LOCATION_INFO", "venue": "VENUE", "address": "ADDRESS", "unit": "APT 123", "cross_streets": "CROSS_STREETS", "city": "CITY", "state_code": "NY", "latitude": 40.0, "longitude": -120.0, "narratives": "NARRATIVES", "shift_name": "SHIFT_NAME", "notification_type": "NOTIFICATION_TYPE"}' https://sizeup.firstduesizeup.com/fd-api/v1/nfirs-notifications/number/2021-00001

#### Success Response

    HTTP/1.1 204 No Content

#### Error Response

    HTTP/1.1 401 Unauthorized
    {
      "code": 0,
      "message": "Your request was made with invalid credentials."
    }

    HTTP/1.1 403 Forbidden
    {
      "code": 0,
      "message": "You are not authorized to perform this action."
    }

    HTTP/1.1 403 Forbidden
    {
      "code": 0,
      "message": "The requested item does not exist or access denied."
    }

    HTTP/1.1 422 Unprocessable Entity
    {
      "code": 0,
      "message": "Validation Failed. Please provide address parameter.",
      "errors": [
        {
          "field": "address",
          "code": "missing_field",
          "message": "Please provide address parameter."
        }
      ]
    }

### DELETE /fd-api/v1/nfirs-notifications/:id

Delete NFIRS notification item.

    DELETE /fd-api/v1/nfirs-notifications/:id

#### Parameters

| Name | Type | Description      |
| :--- | :--- | :--------------- |
| id   | int  | **Required**. Id |

#### Example Requests

    $ curl -i -k -H "Authorization: Bearer 4cc212aac77dad9f9e1e5e2b2be5dd5a" -X DELETE https://sizeup.firstduesizeup.com/fd-api/v1/nfirs-notifications/24

#### Success Response

    HTTP/1.1 204 No Content

#### Error Response

    HTTP/1.1 401 Unauthorized
    {
      "code": 0,
      "message": "Your request was made with invalid credentials."
    }

    HTTP/1.1 403 Forbidden
    {
      "code": 0,
      "message": "The requested item does not exist or access denied."
    }

### DELETE /fd-api/v1/nfirs-notifications/number/:incident_number

Delete NFIRS notification item.

    DELETE /fd-api/v1/nfirs-notifications/number/:incident_number

#### Parameters

| Name            | Type   | Description                   |
| :-------------- | :----- | :---------------------------- |
| incident_number | string | **Required**. Incident Number |

#### Example Requests

    $ curl -i -k -H "Authorization: Bearer 4cc212aac77dad9f9e1e5e2b2be5dd5a" -X DELETE https://sizeup.firstduesizeup.com/fd-api/v1/nfirs-notifications/number/2021-00001

#### Success Response

    HTTP/1.1 204 No Content

#### Error Response

    HTTP/1.1 401 Unauthorized
    {
      "code": 0,
      "message": "Your request was made with invalid credentials."
    }

    HTTP/1.1 403 Forbidden
    {
      "code": 0,
      "message": "The requested item does not exist or access denied."
    }

### POST /fd-api/v1/nfirs-notifications/:nfirs_notification_id/apparatuses

Create a NFIRS notification apparatus.

    POST /fd-api/v1/nfirs-notifications/:nfirs_notification_id/apparatuses

#### Parameters

| Name                     | Type   | Description                                                                   |
| :----------------------- | :----- | :---------------------------------------------------------------------------- |
| unit_code                | string | **Required**. Unit Code                                                       |
| is_aid                   | bool   | Is Aid                                                                        |
| dispatch_at              | string | Dispatch At. ISO 8601 formatted datetime (YYYY-MM-DDTHH:MM:SS:Z)              |
| arrive_at                | string | Arrive At. ISO 8601 formatted datetime (YYYY-MM-DDTHH:MM:SS:Z)                |
| dispatch_acknowledged_at | string | Dispatch Acknowledged At. ISO 8601 formatted datetime (YYYY-MM-DDTHH:MM:SS:Z) |
| enroute_at               | string | Enroute At. ISO 8601 formatted datetime (YYYY-MM-DDTHH:MM:SS:Z)               |
| clear_at                 | string | Clear At. ISO 8601 formatted datetime (YYYY-MM-DDTHH:MM:SS:Z)                 |
| back_in_service_at       | string | Back In Service At. ISO 8601 formatted datetime (YYYY-MM-DDTHH:MM:SS:Z)       |
| canceled_at              | string | Canceled At. ISO 8601 formatted datetime (YYYY-MM-DDTHH:MM:SS:Z)              |
| canceled_stage_code      | string | Canceled Stage Code                                                           |

#### Example Request

    $ curl -i -k -H "Authorization: Bearer 4cc212aac77dad9f9e1e5e2b2be5dd5a" -X POST -d '{"unit_code": "R2", "is_aid": false, "dispatch_at": '2019-02-16T19:42:00+00:004', "arrive_at": "2019-02-16T19:42:00+00:004", "dispatch_acknowledged_at": "2019-02-16T19:42:00+00:004", "enroute_at": "2019-02-16T19:42:00+00:004", "clear_at": "2019-02-16T19:42:00+00:004", "back_in_service_at": "2019-02-16T19:42:00+00:004", "canceled_at": "2019-02-16T19:42:00+00:004", "canceled_stage_code": "on_scene"}' https://sizeup.firstduesizeup.com/fd-api/v1/nfirs-notifications/24/apparatuses

#### Success Response

    HTTP/1.1 201 Created
    {
      "id": 222
    }

#### Error Response

    HTTP/1.1 401 Unauthorized
    {
      "code": 0,
      "message": "Your request was made with invalid credentials."
    }

    HTTP/1.1 403 Forbidden
    {
      "code": 0,
      "message": "You are not authorized to perform this action."
    }

    HTTP/1.1 409 Conflict
    {
      "code": 0,
      "message": "Object already exists."
    }

    HTTP/1.1 422 Unprocessable Entity
    {
      "code": 0,
      "message": "Validation Failed. Please provide unit_code parameter.",
      "errors": [
        {
          "field": "unit_code",
          "code": "missing_field",
          "message": "Please provide unit_code parameter."
        }
      ]
    }

### POST /fd-api/v1/nfirs-notifications/number/:incident_number/apparatuses

Create a NFIRS notification apparatus.

    POST /fd-api/v1/nfirs-notifications/number/:incident_number/apparatuses

#### Parameters

| Name                     | Type   | Description                                                                   |
| :----------------------- | :----- | :---------------------------------------------------------------------------- |
| unit_code                | string | **Required**. Unit Code                                                       |
| is_aid                   | bool   | Is Aid                                                                        |
| dispatch_at              | string | Dispatch At. ISO 8601 formatted datetime (YYYY-MM-DDTHH:MM:SS:Z)              |
| arrive_at                | string | Arrive At. ISO 8601 formatted datetime (YYYY-MM-DDTHH:MM:SS:Z)                |
| dispatch_acknowledged_at | string | Dispatch Acknowledged At. ISO 8601 formatted datetime (YYYY-MM-DDTHH:MM:SS:Z) |
| enroute_at               | string | Enroute At. ISO 8601 formatted datetime (YYYY-MM-DDTHH:MM:SS:Z)               |
| clear_at                 | string | Clear At. ISO 8601 formatted datetime (YYYY-MM-DDTHH:MM:SS:Z)                 |
| back_in_service_at       | string | Back In Service At. ISO 8601 formatted datetime (YYYY-MM-DDTHH:MM:SS:Z)       |
| canceled_at              | string | Canceled At. ISO 8601 formatted datetime (YYYY-MM-DDTHH:MM:SS:Z)              |
| canceled_stage_code      | string | Canceled Stage Code                                                           |

#### Example Request

    $ curl -i -k -H "Authorization: Bearer 4cc212aac77dad9f9e1e5e2b2be5dd5a" -X POST -d '{"unit_code": "R2", "is_aid": false, "dispatch_at": '2019-02-16T19:42:00+00:004', "arrive_at": "2019-02-16T19:42:00+00:004", "dispatch_acknowledged_at": "2019-02-16T19:42:00+00:004", "enroute_at": "2019-02-16T19:42:00+00:004", "clear_at": "2019-02-16T19:42:00+00:004", "back_in_service_at": "2019-02-16T19:42:00+00:004", "canceled_at": "2019-02-16T19:42:00+00:004", "canceled_stage_code": "on_scene"}' https://sizeup.firstduesizeup.com/fd-api/v1/nfirs-notifications/number/2021-00001/apparatuses

#### Success Response

    HTTP/1.1 204 No Content

#### Error Response

    HTTP/1.1 401 Unauthorized
    {
      "code": 0,
      "message": "Your request was made with invalid credentials."
    }

    HTTP/1.1 403 Forbidden
    {
      "code": 0,
      "message": "You are not authorized to perform this action."
    }

    HTTP/1.1 409 Conflict
    {
      "code": 0,
      "message": "Object already exists."
    }

    HTTP/1.1 422 Unprocessable Entity
    {
      "code": 0,
      "message": "Validation Failed. Please provide unit_code parameter.",
      "errors": [
        {
          "field": "unit_code",
          "code": "missing_field",
          "message": "Please provide unit_code parameter."
        }
      ]
    }

### PUT /fd-api/v1/nfirs-notifications/:nfirs_notification_id/apparatuses/:id

Update NFIRS notification apparatus item completely.

    PUT /fd-api/v1/nfirs-notifications/:nfirs_notification_id/apparatuses/:id

#### Parameters

| Name                     | Type   | Description                                                                   |
| :----------------------- | :----- | :---------------------------------------------------------------------------- |
| unit_code                | string | **Required**. Unit Code                                                       |
| is_aid                   | bool   | Is Aid                                                                        |
| dispatch_at              | string | Dispatch At. ISO 8601 formatted datetime (YYYY-MM-DDTHH:MM:SS:Z)              |
| arrive_at                | string | Arrive At. ISO 8601 formatted datetime (YYYY-MM-DDTHH:MM:SS:Z)                |
| dispatch_acknowledged_at | string | Dispatch Acknowledged At. ISO 8601 formatted datetime (YYYY-MM-DDTHH:MM:SS:Z) |
| enroute_at               | string | Enroute At. ISO 8601 formatted datetime (YYYY-MM-DDTHH:MM:SS:Z)               |
| clear_at                 | string | Clear At. ISO 8601 formatted datetime (YYYY-MM-DDTHH:MM:SS:Z)                 |
| back_in_service_at       | string | Back In Service At. ISO 8601 formatted datetime (YYYY-MM-DDTHH:MM:SS:Z)       |
| canceled_at              | string | Canceled At. ISO 8601 formatted datetime (YYYY-MM-DDTHH:MM:SS:Z)              |
| canceled_stage_code      | string | Canceled Stage Code                                                           |

#### Example Request

    $ curl -i -k -H "Authorization: Bearer 4cc212aac77dad9f9e1e5e2b2be5dd5a" -X PUT -d '{"unit_code": "R2", "is_aid": false, "dispatch_at": '2019-02-16T19:42:00+00:004', "arrive_at": "2019-02-16T19:42:00+00:004", "dispatch_acknowledged_at": "2019-02-16T19:42:00+00:004", "enroute_at": "2019-02-16T19:42:00+00:004", "clear_at": "2019-02-16T19:42:00+00:004", "back_in_service_at": "2019-02-16T19:42:00+00:004", "canceled_at": "2019-02-16T19:42:00+00:004", "canceled_stage_code": "on_scene"}' https://sizeup.firstduesizeup.com/fd-api/v1/nfirs-notifications/24/apparatuses/25

#### Success Response

    HTTP/1.1 204 No Content

#### Error Response

    HTTP/1.1 401 Unauthorized
    {
      "code": 0,
      "message": "Your request was made with invalid credentials."
    }

    HTTP/1.1 403 Forbidden
    {
      "code": 0,
      "message": "You are not authorized to perform this action."
    }

    HTTP/1.1 403 Forbidden
    {
      "code": 0,
      "message": "The requested item does not exist or access denied."
    }

    HTTP/1.1 422 Unprocessable Entity
    {
      "code": 0,
      "message": "Validation Failed. Please provide unit_code parameter.",
      "errors": [
        {
          "field": "unit_code",
          "code": "missing_field",
          "message": "Please provide unit_code parameter."
        }
      ]
    }

### PUT /fd-api/v1/nfirs-notifications/number/:incident_number/apparatuses/code/:unit_code

Update NFIRS notification apparatus item completely.

    PUT /fd-api/v1/nfirs-notifications/number/:incident_number/apparatuses/code/:unit_code

#### Parameters

| Name                     | Type   | Description                                                                   |
| :----------------------- | :----- | :---------------------------------------------------------------------------- |
| is_aid                   | bool   | Is Aid                                                                        |
| dispatch_at              | string | Dispatch At. ISO 8601 formatted datetime (YYYY-MM-DDTHH:MM:SS:Z)              |
| arrive_at                | string | Arrive At. ISO 8601 formatted datetime (YYYY-MM-DDTHH:MM:SS:Z)                |
| dispatch_acknowledged_at | string | Dispatch Acknowledged At. ISO 8601 formatted datetime (YYYY-MM-DDTHH:MM:SS:Z) |
| enroute_at               | string | Enroute At. ISO 8601 formatted datetime (YYYY-MM-DDTHH:MM:SS:Z)               |
| clear_at                 | string | Clear At. ISO 8601 formatted datetime (YYYY-MM-DDTHH:MM:SS:Z)                 |
| back_in_service_at       | string | Back In Service At. ISO 8601 formatted datetime (YYYY-MM-DDTHH:MM:SS:Z)       |
| canceled_at              | string | Canceled At. ISO 8601 formatted datetime (YYYY-MM-DDTHH:MM:SS:Z)              |
| canceled_stage_code      | string | Canceled Stage Code                                                           |

#### Example Request

    $ curl -i -k -H "Authorization: Bearer 4cc212aac77dad9f9e1e5e2b2be5dd5a" -X PUT -d '{"is_aid": false, "dispatch_at": '2019-02-16T19:42:00+00:004', "arrive_at": "2019-02-16T19:42:00+00:004", "dispatch_acknowledged_at": "2019-02-16T19:42:00+00:004", "enroute_at": "2019-02-16T19:42:00+00:004", "clear_at": "2019-02-16T19:42:00+00:004", "back_in_service_at": "2019-02-16T19:42:00+00:004", "canceled_at": "2019-02-16T19:42:00+00:004", "canceled_stage_code": "on_scene"}' https://sizeup.firstduesizeup.com/fd-api/v1/nfirs-notifications/number/2021-00001/apparatuses/code/R2

#### Success Response

    HTTP/1.1 204 No Content

#### Error Response

    HTTP/1.1 401 Unauthorized
    {
      "code": 0,
      "message": "Your request was made with invalid credentials."
    }

    HTTP/1.1 403 Forbidden
    {
      "code": 0,
      "message": "You are not authorized to perform this action."
    }

    HTTP/1.1 403 Forbidden
    {
      "code": 0,
      "message": "The requested item does not exist or access denied."
    }

    HTTP/1.1 422 Unprocessable Entity
    {
      "code": 0,
      "message": "Validation Failed. Please provide unit_code parameter.",
      "errors": [
        {
          "field": "unit_code",
          "code": "missing_field",
          "message": "Please provide unit_code parameter."
        }
      ]
    }

### DELETE /fd-api/v1/nfirs-notifications/:nfirs_notification_id/apparatuses/:id

Delete NFIRS notification apparatus item.

    DELETE /fd-api/v1/nfirs-notifications/:nfirs_notification_id/apparatuses/:id

#### Parameters

| Name | Type | Description      |
| :--- | :--- | :--------------- |
| id   | int  | **Required**. Id |

#### Example Requests

    $ curl -i -k -H "Authorization: Bearer 4cc212aac77dad9f9e1e5e2b2be5dd5a" -X DELETE https://sizeup.firstduesizeup.com/fd-api/v1/nfirs-notifications/24/apparatuses/25

#### Success Response

    HTTP/1.1 204 No Content

#### Error Response

    HTTP/1.1 401 Unauthorized
    {
      "code": 0,
      "message": "Your request was made with invalid credentials."
    }

    HTTP/1.1 403 Forbidden
    {
      "code": 0,
      "message": "The requested item does not exist or access denied."
    }

### DELETE /fd-api/v1/nfirs-notifications/number/:incident_number/apparatuses/code/:unit_code

Delete NFIRS notification apparatus item.

    DELETE /fd-api/v1/nfirs-notifications/number/:incident_number/apparatuses/code/:unit_code

#### Parameters

| Name            | Type   | Description                   |
| :-------------- | :----- | :---------------------------- |
| incident_number | string | **Required**. Incident Number |
| unit_code       | string | **Required**. Unit Code       |

#### Example Requests

    $ curl -i -k -H "Authorization: Bearer 4cc212aac77dad9f9e1e5e2b2be5dd5a" -X DELETE https://sizeup.firstduesizeup.com/fd-api/v1/nfirs-notifications/number/2021-00001/apparatuses/code/R2

#### Success Response

    HTTP/1.1 204 No Content

#### Error Response

    HTTP/1.1 401 Unauthorized
    {
      "code": 0,
      "message": "Your request was made with invalid credentials."
    }

    HTTP/1.1 403 Forbidden
    {
      "code": 0,
      "message": "The requested item does not exist or access denied."
    }

### POST /fd-api/v1/nfirs-notifications/:nfirs_notification_id/apparatuses/:nfirs_apparatus_id/personnel

Create a NFIRS notification personnel.

    POST /fd-api/v1/nfirs-notifications/:nfirs_notification_id/apparatuses/:nfirs_apparatus_id/personnel

#### Parameters

| Name                | Type   | Description         |
| :------------------ | :----- | :------------------ |
| xref_id             | string | Xref Id             |
| first_name          | string | First Name          |
| middle_initial      | string | Middle Initial      |
| last_name           | string | Last Name           |
| personnel_agency_id | string | Personnel Agency Id |

#### Example Request

    $ curl -i -k -H "Authorization: Bearer 4cc212aac77dad9f9e1e5e2b2be5dd5a" -X POST -d '{"xref_id": "NNP-01", "first_name": "FIRST_NAME", "middle_initial": "MIDDLE_INITIAL", "last_name": "LAST_NAME", "personnel_agency_id": "PA-01"}' https://sizeup.firstduesizeup.com/fd-api/v1/nfirs-notifications/24/apparatuses/25/personnel

#### Success Response

    HTTP/1.1 201 Created
    {
      "id": 333
    }

#### Error Response

    HTTP/1.1 401 Unauthorized
    {
      "code": 0,
      "message": "Your request was made with invalid credentials."
    }

    HTTP/1.1 403 Forbidden
    {
      "code": 0,
      "message": "You are not authorized to perform this action."
    }

    HTTP/1.1 409 Conflict
    {
      "code": 0,
      "message": "Object already exists."
    }

### POST /fd-api/v1/nfirs-notifications/number/:incident_number/apparatuses/code/:unit_code/personnel

Create a NFIRS notification personnel.

    POST /fd-api/v1/nfirs-notifications/number/:incident_number/apparatuses/code/:unit_code/personnel

#### Parameters

| Name                | Type   | Description         |
| :------------------ | :----- | :------------------ |
| xref_id             | string | Xref Id             |
| first_name          | string | First Name          |
| middle_initial      | string | Middle Initial      |
| last_name           | string | Last Name           |
| personnel_agency_id | string | Personnel Agency Id |

#### Example Request

    $ curl -i -k -H "Authorization: Bearer 4cc212aac77dad9f9e1e5e2b2be5dd5a" -X POST -d '{"xref_id": "NNP-01", "first_name": "FIRST_NAME", "middle_initial": "MIDDLE_INITIAL", "last_name": "LAST_NAME", "personnel_agency_id": "PA-01"}' https://sizeup.firstduesizeup.com/fd-api/v1/nfirs-notifications/number/2021-00001/apparatuses/code/R2/personnel

#### Success Response

    HTTP/1.1 204 No Content

#### Error Response

    HTTP/1.1 401 Unauthorized
    {
      "code": 0,
      "message": "Your request was made with invalid credentials."
    }

    HTTP/1.1 403 Forbidden
    {
      "code": 0,
      "message": "You are not authorized to perform this action."
    }

    HTTP/1.1 409 Conflict
    {
      "code": 0,
      "message": "Object already exists."
    }

### PUT /fd-api/v1/nfirs-notifications/:nfirs_notification_id/apparatuses/:nfirs_apparatus_id/personnel/:id

Update NFIRS notification apparatus item completely.

    PUT /fd-api/v1/nfirs-notifications/:nfirs_notification_id/apparatuses/:nfirs_apparatus_id/personnel/:id

#### Parameters

| Name                | Type   | Description         |
| :------------------ | :----- | :------------------ |
| xref_id             | string | Xref Id             |
| first_name          | string | First Name          |
| middle_initial      | string | Middle Initial      |
| last_name           | string | Last Name           |
| personnel_agency_id | string | Personnel Agency Id |

#### Example Request

    $ curl -i -k -H "Authorization: Bearer 4cc212aac77dad9f9e1e5e2b2be5dd5a" -X PUT -d '{"xref_id": "NNP-01", "first_name": "FIRST_NAME", "middle_initial": "MIDDLE_INITIAL", "last_name": "LAST_NAME", "personnel_agency_id": "PA-01"}' https://sizeup.firstduesizeup.com/fd-api/v1/nfirs-notifications/24/apparatuses/25/personnel/35

#### Success Response

    HTTP/1.1 204 No Content

#### Error Response

    HTTP/1.1 401 Unauthorized
    {
      "code": 0,
      "message": "Your request was made with invalid credentials."
    }

    HTTP/1.1 403 Forbidden
    {
      "code": 0,
      "message": "You are not authorized to perform this action."
    }

    HTTP/1.1 403 Forbidden
    {
      "code": 0,
      "message": "The requested item does not exist or access denied."
    }

### PUT /fd-api/v1/nfirs-notifications/numner/:incident_number/apparatuses/code/:unit_code/personnel/xref/:xref_id

Update NFIRS notification apparatus item completely.

    PUT /fd-api/v1/nfirs-notifications/number/:incident_number/apparatuses/code/:unit_code/personnel/xref/:xref_id

#### Parameters

| Name                | Type   | Description         |
| :------------------ | :----- | :------------------ |
| first_name          | string | First Name          |
| middle_initial      | string | Middle Initial      |
| last_name           | string | Last Name           |
| personnel_agency_id | string | Personnel Agency Id |

#### Example Request

    $ curl -i -k -H "Authorization: Bearer 4cc212aac77dad9f9e1e5e2b2be5dd5a" -X PUT -d '{"first_name": "FIRST_NAME", "middle_initial": "MIDDLE_INITIAL", "last_name": "LAST_NAME", "personnel_agency_id": "PA-01"}' https://sizeup.firstduesizeup.com/fd-api/v1/nfirs-notifications/number/2021-00001/apparatuses/code/R2/personnel/xref/NNP-01

#### Success Response

    HTTP/1.1 204 No Content

#### Error Response

    HTTP/1.1 401 Unauthorized
    {
      "code": 0,
      "message": "Your request was made with invalid credentials."
    }

    HTTP/1.1 403 Forbidden
    {
      "code": 0,
      "message": "You are not authorized to perform this action."
    }

    HTTP/1.1 403 Forbidden
    {
      "code": 0,
      "message": "The requested item does not exist or access denied."
    }

### DELETE /fd-api/v1/nfirs-notifications/:nfirs_notification_id/apparatuses/:nfirs_apparatus_id/personnel/:id

Delete NFIRS notification apparatus item.

    DELETE /fd-api/v1/nfirs-notifications/:nfirs_notification_id/apparatuses/:nfirs_apparatus_id/personnel/:id

#### Parameters

| Name | Type | Description      |
| :--- | :--- | :--------------- |
| id   | int  | **Required**. Id |

#### Example Requests

    $ curl -i -k -H "Authorization: Bearer 4cc212aac77dad9f9e1e5e2b2be5dd5a" -X DELETE https://sizeup.firstduesizeup.com/fd-api/v1/nfirs-notifications/24/apparatuses/25/personnel/35

#### Success Response

    HTTP/1.1 204 No Content

#### Error Response

    HTTP/1.1 401 Unauthorized
    {
      "code": 0,
      "message": "Your request was made with invalid credentials."
    }

    HTTP/1.1 403 Forbidden
    {
      "code": 0,
      "message": "The requested item does not exist or access denied."
    }

### DELETE /fd-api/v1/nfirs-notifications/number/:incident_number/apparatuses/code/:unit_code/personnel/xref/:xref_id

Delete NFIRS notification apparatus item.

    DELETE /fd-api/v1/nfirs-notifications/number/:incident_number/apparatuses/code/:unit_code/personnel/xref/:xref_id

#### Parameters

| Name            | Type   | Description                   |
| :-------------- | :----- | :---------------------------- |
| incident_number | string | **Required**. Incident Number |
| unit_code       | string | **Required**. Unit Code       |
| xref_id         | string | **Required**. Xref Id         |

#### Example Requests

    $ curl -i -k -H "Authorization: Bearer 4cc212aac77dad9f9e1e5e2b2be5dd5a" -X DELETE https://sizeup.firstduesizeup.com/fd-api/v1/nfirs-notifications/number/2021-00001/apparatuses/code/R2/personnel/xref/NNP-01

#### Success Response

    HTTP/1.1 204 No Content

#### Error Response

    HTTP/1.1 401 Unauthorized
    {
      "code": 0,
      "message": "Your request was made with invalid credentials."
    }

    HTTP/1.1 403 Forbidden
    {
      "code": 0,
      "message": "The requested item does not exist or access denied."
    }

### GET /fd-api/v1/logs/settings

Get Settings for Logs.

    GET /fd-api/v1/logs/settings

#### Example Request

    $ curl -i -k -H "Authorization: Bearer 4cc212aac77dad9f9e1e5e2b2be5dd5a" https://sizeup.firstduesizeup.com/fd-api/v1/logs/settings

#### Success Response

{
"is_fdapi_log_enabled": true
}

#### Error Response

    HTTP/1.1 401 Unauthorized
    {
      "code": 0,
      "message": "Your request was made with invalid credentials."
    }

    HTTP/1.1 403 Forbidden
    {
      "code": 0,
      "message": "You are not authorized to perform this action."
    }

### POST /fd-api/v1/logs

Import a log entry.

    POST /fd-api/v1/logs

#### Parameters

| Name       | Type   | Description           |
| :--------- | :----- | :-------------------- |
| message    | string | **Required**. Message |
| level_code | string | **Required**. Level   |
| category   | string | Category              |

#### Example Request

    $ curl -i -k -H "Authorization: Bearer 4cc212aac77dad9f9e1e5e2b2be5dd5a" -X POST -d '[{"message": "Log1", "level_code": "error", "category": "application"}]' https://sizeup.firstduesizeup.com/fd-api/v1/logs

#### Success Response

    HTTP/1.1 204 No Content

#### Error Response

    HTTP/1.1 401 Unauthorized
    {
      "code": 0,
      "message": "Your request was made with invalid credentials."
    }

    HTTP/1.1 403 Forbidden
    {
      "code": 0,
      "message": "You are not authorized to perform this action."
    }

    HTTP/1.1 422 Unprocessable Entity
    {
      "code": 0,
      "message": "Validation Failed. Max items allowed exceeded.",
      "errors": []
    }

    HTTP/1.1 422 Unprocessable Entity
    {
      "code": 0,
      "message": Validation Failed. Empty parameters.",
      "errors": []
    }

### POST /fd-api/v1/logs/batch

Import a bunch of log entries. This will create every single entry.

    POST /fd-api/v1/logs

#### Parameters is an array of objects. Max size is 1000 items.

| Name       | Type   | Description           |
| :--------- | :----- | :-------------------- |
| message    | string | **Required**. Message |
| level_code | string | **Required**. Level   |
| category   | string | Category              |

#### Example Request

    $ curl -i -k -H "Authorization: Bearer 4cc212aac77dad9f9e1e5e2b2be5dd5a" -X POST -d '[{"message": "Log1", "level_code": "error", "category": "application"}]' https://sizeup.firstduesizeup.com/fd-api/v1/logs/batch

#### Success Response

    HTTP/1.1 204 No Content

#### Error Response

    HTTP/1.1 401 Unauthorized
    {
      "code": 0,
      "message": "Your request was made with invalid credentials."
    }

    HTTP/1.1 403 Forbidden
    {
      "code": 0,
      "message": "You are not authorized to perform this action."
    }

    HTTP/1.1 422 Unprocessable Entity
    {
      "code": 0,
      "message": "Validation Failed. Max items allowed exceeded.",
      "errors": []
    }

    HTTP/1.1 422 Unprocessable Entity
    {
      "code": 0,
      "message": Validation Failed. Empty parameters.",
      "errors": []
    }

## Change Log:

- added `GET /fd-api/v1/logs/settings` method
- added `POST /fd-api/v1/logs` method
- added `POST /fd-api/v1/logs/batch` method
- added `PUT /fd-api/v1/nfirs-notifications/number/:incident_number` method
- added `DELETE /fd-api/v1/nfirs-notification/number/:incident_number` method
- added `POST /fd-api/v1/nfirs-notifications/number/:incident_number/apparatuses` method
- added `PUT /fd-api/v1/nfirs-notifications/number/:incident_number/apparatuses/code/:unit_code` method
- added `DELETE /fd-api/v1/nfirs-notification/number/:incident_number/apparatuses/code/:unit_code` method
- added `POST /fd-api/v1/nfirs-notifications/number/:incident_number/apparatuses/code/:unit_code/personnel` method
- added `PUT /fd-api/v1/nfirs-notifications/number/:incident_number/apparatuses/code/:unit_code/personnel/xref/:xref_id` method
- added `DELETE /fd-api/v1/nfirs-notification/number/:incident_number/apparatuses/code/:unit_code/personnel/xref/:xref_id` method
- added `system_id` value to `GET /fd-api/v1/tce-inventories/xref/:inventory_id` method
- added `system_id` param to `POST /fd-api/v1/tce-inventories` method
- added `is_inventory_tracked`, `max_inventory_count`, `is_service_dates_based_on_inventory` values to `GET /fd-api/v1/tce-systems/xref/:system_id` method
- added `is_inventory_tracked`, `max_inventory_count`, `is_service_dates_based_on_inventory` params to `POST /fd-api/v1/tce-systems` and `PATCH /fd-api/v1/tce-systems/xref/:system_id` methods
- added `GET /fd-api/v1/nfirs-notifications/:id` method
- added `POST /fd-api/v1/nfirs-notifications` method
- added `PUT /fd-api/v1/nfirs-notifications/:id` method
- added `DELETE /fd-api/v1/nfirs-notification/:id` method
- added `POST /fd-api/v1/nfirs-notifications/:nfirs_notification_id/apparatuses` method
- added `PUT /fd-api/v1/nfirs-notifications/:nfirs_notification_id/apparatuses/:id` method
- added `DELETE /fd-api/v1/nfirs-notification/:nfirs_notification_id/apparatuses/:id` method
- added `POST /fd-api/v1/nfirs-notifications/:nfirs_notification_id/apparatuses/:nfirs_apparatus_id/personnel` method
- added `PUT /fd-api/v1/nfirs-notifications/:nfirs_notification_id/apparatuses/:nfirs_apparatus_id/personnel/:id` method
- added `DELETE /fd-api/v1/nfirs-notification/:nfirs_notification_id/apparatuses/:nfirs_apparatus_id/personnel/:id` method
- added `address2` value to `GET /fd-api/v1/dispatches` method
- added `address2` param to `POST /fd-api/v1/dispatches`, `PATCH /fd-api/v1/dispatches/xref/:xref_id` and `PUT /fd-api/v1/dispatches/xref/:xref_id` methods
- added `is_current` value to `GET /fd-api/v1/tce-inventories/xref/:inventory_id` method
- added `is_current` param to `POST /fd-api/v1/tce-inventories` and `PATCH /fd-api/v1/tce-inventories/xref/:inventory_id` methods
- added `is_current` value to `GET /fd-api/v1/tce-systems/xref/:system_id` method
- added `is_current` param to `POST /fd-api/v1/tce-systems` and `PATCH /fd-api/v1/tce-systems/xref/:system_id` methods
- added `HEAD /fd-api/v1/iams/email/:email` method
- changed response of `POST /fd-api/v1/preplans/units/caution-notes` method
- added `GET /fd-api/v1/preplans/units/caution-notes`, `DELETE /fd-api/v1/preplans/units/caution-notes` methods
- added `incident_type_code` value to `GET /fd-api/v1/dispatches` method
- added `incident_type_code` param to `POST /fd-api/v1/dispatches`, `PATCH /fd-api/v1/dispatches/xref/:xref_id` and `PUT /fd-api/v1/dispatches/xref/:xref_id` methods
- deleted `latitude` and `longitude` params from `POST /fd-api/v1/preplans/units/caution-notes` method
- added `POST /fd-api/v1/preplans/units/caution-notes` method
- added `tag_color_code` value to `GET /fd-api/v1/tce-premises/xref/:id`, `GET /fd-api/v1/tce-systems/xref/:id` and `GET /fd-api/v1/tce-inventories/xref/:id` methods
- added `tag_color_code` param to `POST /fd-api/v1/tce-premises`, `PATCH /fd-api/v1/tce-premises/xref/:id`, `POST /fd-api/v1/tce-systems`, PATCH `/fd-api/v1/tce-systems/xref/:id`, `POST /fd-api/v1/tce-inventories` and PATCH `/fd-api/v1/tce-inventories/xref/:id` methods
- added `GET /fd-api/v1/tce-premises/xref/:id`, `GET /fd-api/v1/tce-systems/xref/:id` and `GET /fd-api/v1/tce-inventories/xref/:id`methods
- renamed `has_open_dificiencies` to `has_open_deficiencies` in `POST /fd-api/v1/tce-systems`, `PATCH /fd-api/v1/tce-systems/xref/:id`, `POST /fd-api/v1/tce-inventories` and `PATCH /fd-api/v1/tce-inventories/xref/:id` methods
- added `system_type_name`, `last_inspection_date`, `next_inspection_date`, `has_open_dificiencies` and `description` params to `POST /fd-api/v1/tce-inventories` and `PATCH /fd-api/v1/tce-inventories/xref/:id` methods
- deleted `system_profile_current`, `system_profile_compliance` and `tce_system_id` params from `POST /fd-api/v1/tce-inventories` and `PATCH /fd-api/v1/tce-inventories/xref/:id` methods
- added `has_open_dificiencies` and `status_code` params to `POST /fd-api/v1/tce-systems` and `PATCH /fd-api/v1/tce-systems/xref/:id` methods
- renamed `last_inspected_date` to `last_inspection_date` in `POST /fd-api/v1/tce-systems` and `PATCH /fd-api/v1/tce-systems/xref/:id` methods
- renamed `renewal_date` to `next_inspection_date` in `POST /fd-api/v1/tce-systems` and `PATCH /fd-api/v1/tce-systems/xref/:id` methods
- renamed `address` param to `address1` in `POST /fd-api/v1/tce-premises` and `PATCH /fd-api/v1/tce-premises/xref/:id` methods
- deleted `system_profile_current`, `system_profile_compliance` and `status_code` params from `POST /fd-api/v1/tce-systems` and `PATCH /fd-api/v1/tce-systems/xref/:id` methods
- added `POST /fd-api/v1/tce-inventories` and `PATCH /fd-api/v1/tce-inventories/xref/:id` methods
- added `PATCH /fd-api/v1/tce-systems/xref/:id` method
- added `POST /fd-api/v1/tce-premises`, `PATCH /fd-api/v1/tce-premises/xref/:id` and `POST /fd-api/v1/tce-systems` methods
- `message` param is not required in `POST /fd-api/v1/dispatches` and `PUT /fd-api/v1/dispatches/xref/:xref_id` methods
- added `PUT /fd-api/v1/dispatches/xref/:xref_id` method
- added `GET /fd-api/v1/dispatches` method
- added `unit_codes` param to `PATCH /fd-api/v1/dispatches/xref/:xref_id` method
- added `PATCH /fd-api/v1/dispatches/xref/:xref_id` method
- added HTTP error code 406 to `POST /dispatches` method
- added `xref_id` param to `POST /dispatches` method
