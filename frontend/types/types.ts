export interface FormType {
  name: string,
  form_id: number,
  password: string | null,
  description: string
  questions: QuestionType[],
  created_at: Date,
  created_by: number,
  updated_at: Date,
  require_auth: boolean,
  resp_limit: number | null
}

export interface QuestionType {
  name: string,
  form_id: number,
  id: number,
  type: number,
  description: string,
  min: number | null,
  max: number | null,
  choices: ChoicesType | null
}

export interface ChoicesType {
  multiple_sections: boolean,
  choices: string[] | null
}

export interface Response {
  id: number,
  form_id: number,
  submitted_by: number,
  submitted_at: Date,
  responses: {
    id: number,
    response: string | number | boolean | undefined
  }[]
}