import InputField from '../fields/InputField'

type CtaBandBlockEditorProps = {
  index: number
}

export default function CtaBandBlockEditor({ index }: CtaBandBlockEditorProps) {
  return (
    <div className='grid gap-4 lg:grid-cols-2'>
      <InputField name={`blocks.${index}.text`} label='CTA text' placeholder='Ready to start?' />
      <InputField name={`blocks.${index}.buttonText`} label='Button text' placeholder='Request demo' />
      <InputField name={`blocks.${index}.buttonLink`} label='Button link' placeholder='/contact' />
    </div>
  )
}
