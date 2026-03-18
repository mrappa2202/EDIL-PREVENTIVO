import * as React from "react";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { cn } from "../../lib/utils";
import { Button } from "./button";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "./command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "./popover";

export function Combobox({
    options = [],
    value,
    onChange,
    onAddNew,
    placeholder = "Seleziona...",
    searchPlaceholder = "Cerca...",
    emptyText = "Nessun risultato",
    allowCustom = true,
    className,
    disabled = false,
    "data-testid": testId,
}) {
    const [open, setOpen] = React.useState(false);
    const [inputValue, setInputValue] = React.useState("");

    const normalizedOptions = options.map((opt) =>
        typeof opt === "string" ? { value: opt, label: opt } : opt
    );

    const filteredOptions = normalizedOptions.filter((opt) =>
        opt.label.toLowerCase().includes(inputValue.toLowerCase())
    );

    const exactMatch = normalizedOptions.some(
        (opt) => opt.value.toLowerCase() === inputValue.toLowerCase()
    );

    const showAddNew = allowCustom && inputValue && !exactMatch;

    const handleSelect = (selectedValue) => {
        onChange(selectedValue);
        setOpen(false);
        setInputValue("");
    };

    const handleAddNew = () => {
        if (onAddNew) {
            onAddNew(inputValue);
        }
        onChange(inputValue);
        setOpen(false);
        setInputValue("");
    };

    const displayValue = value
        ? normalizedOptions.find((opt) => opt.value === value)?.label || value
        : "";

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn(
                        "w-full justify-between font-normal",
                        !value && "text-muted-foreground",
                        className
                    )}
                    disabled={disabled}
                    data-testid={testId}
                >
                    <span className="truncate">{displayValue || placeholder}</span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                <Command shouldFilter={false}>
                    <CommandInput
                        placeholder={searchPlaceholder}
                        value={inputValue}
                        onValueChange={setInputValue}
                    />
                    <CommandList>
                        <CommandEmpty>
                            {showAddNew ? null : emptyText}
                        </CommandEmpty>
                        <CommandGroup>
                            {filteredOptions.map((opt) => (
                                <CommandItem
                                    key={opt.value}
                                    value={opt.value}
                                    onSelect={() => handleSelect(opt.value)}
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            value === opt.value ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    {opt.label}
                                </CommandItem>
                            ))}
                            {showAddNew && (
                                <CommandItem
                                    onSelect={handleAddNew}
                                    className="text-primary"
                                >
                                    <Plus className="mr-2 h-4 w-4" />
                                    Aggiungi "{inputValue}" alle opzioni
                                </CommandItem>
                            )}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}

// Simpler variant for inline editing
export function ComboboxInput({
    options = [],
    value,
    onChange,
    onAddNew,
    placeholder = "",
    allowCustom = true,
    className,
    disabled = false,
}) {
    const [inputValue, setInputValue] = React.useState(value || "");
    const [showSuggestions, setShowSuggestions] = React.useState(false);
    const inputRef = React.useRef(null);

    React.useEffect(() => {
        setInputValue(value || "");
    }, [value]);

    const normalizedOptions = options.map((opt) =>
        typeof opt === "string" ? opt : opt.value || opt.label
    );

    const filteredOptions = normalizedOptions.filter(
        (opt) => opt.toLowerCase().includes(inputValue.toLowerCase()) && opt !== inputValue
    );

    const handleInputChange = (e) => {
        const newValue = e.target.value;
        setInputValue(newValue);
        onChange(newValue);
        setShowSuggestions(true);
    };

    const handleSelect = (selectedValue) => {
        setInputValue(selectedValue);
        onChange(selectedValue);
        setShowSuggestions(false);
    };

    const handleBlur = () => {
        setTimeout(() => setShowSuggestions(false), 200);
    };

    const handleAddNew = () => {
        if (onAddNew && inputValue) {
            onAddNew(inputValue);
        }
        setShowSuggestions(false);
    };

    const exactMatch = normalizedOptions.some(
        (opt) => opt.toLowerCase() === inputValue.toLowerCase()
    );

    const showAddOption = allowCustom && inputValue && !exactMatch && onAddNew;

    return (
        <div className="relative">
            <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={handleInputChange}
                onFocus={() => setShowSuggestions(true)}
                onBlur={handleBlur}
                placeholder={placeholder}
                disabled={disabled}
                className={cn(
                    "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors",
                    "placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                    "disabled:cursor-not-allowed disabled:opacity-50",
                    className
                )}
            />
            {showSuggestions && (filteredOptions.length > 0 || showAddOption) && (
                <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-48 overflow-auto">
                    {filteredOptions.slice(0, 8).map((opt) => (
                        <button
                            key={opt}
                            type="button"
                            className="w-full px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground"
                            onMouseDown={() => handleSelect(opt)}
                        >
                            {opt}
                        </button>
                    ))}
                    {showAddOption && (
                        <button
                            type="button"
                            className="w-full px-3 py-2 text-left text-sm text-primary hover:bg-accent flex items-center gap-2"
                            onMouseDown={handleAddNew}
                        >
                            <Plus className="h-4 w-4" />
                            Salva "{inputValue}"
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
