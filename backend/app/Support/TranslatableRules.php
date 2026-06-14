<?php

namespace App\Support;

class TranslatableRules
{
    /**
     * Build validation rules for a JSON translatable field.
     *
     * @return array<string, string>
     */
    public static function for(string $field, bool $required = true, ?int $maxLength = null): array
    {
        $default = config('content_languages.default', 'en');
        $supported = config('content_languages.supported', ['en']);
        $rules = [$field => ($required ? 'required' : 'sometimes').'|array'];

        foreach ($supported as $code) {
            $rule = $code === $default
                ? ($required ? 'required' : 'sometimes').'|string'
                : 'nullable|string';

            if ($maxLength !== null) {
                $rule .= "|max:{$maxLength}";
            }

            $rules["{$field}.{$code}"] = $rule;
        }

        return $rules;
    }
}
