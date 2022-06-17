export interface FormType {
  name: string,
  form_id: number,
  password: string,
  description: string
  questions: QuestionType[]
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
  response_at: Date,
  responses: {
    id: number,
    response: string | number | boolean | undefined
  }[]
}