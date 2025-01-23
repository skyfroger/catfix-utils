/**
 * Описание типов для JSON-файла, полученного после распаковыки проекта.
 */

type JSONValue =
    | string
    | number
    | boolean
    | undefined
    | null
    | { [x: string]: JSONValue }
    | Array<JSONValue>;

type Params = Array<string | number | null | Params>;

type Monitor = {
    id: string;
    mode: string;
    opcode: string;
    params: JSONValue;
    spriteName?: string;
    value: number;
    width: number;
    height: number;
    x: number;
    y: number;
    visible: boolean;
    sliderMin: number;
    sliderMax: number;
};

export type Block = {
    opcode: string;
    next?: string;
    parent?: string;
    inputs: {
        INPUTS?: Params;
        SUBSTACK?: Params;
        SUBSTACK2?: Params;
        CONDITION?: Params;
        OPERAND?: Params;
        OPERAND1?: Params;
        OPERAND2?: Params;
        LETTER?: Params;
        STRING?: Params;
        STRING1?: Params;
        STRING2?: Params;
        NUM: Params;
        NUM1?: Params;
        NUM2?: Params;
        FROM?: Params;
        TO?: Params;
    };
    fields: {
        KEY_OPTION?: Params;
        WHENGREATERTHANMENU?: Params;
        BROADCAST_OPTION?: Params;
        OPERATOR?: Params;
    };
    shadow: boolean;
    topLevel: boolean;
    mutation: {
        tagName: string;
        children: Array<JSONValue>;
        proccode: string;
        argumentids: Array<JSONValue>;
        argumentnames: Array<JSONValue>;
        argumentdefaults: Array<JSONValue>;
        warp: boolean;
    };
    x?: number;
    y?: number;
};

export type Target = {
    isStage: boolean;
    name: string;
    variables: { [key: string]: Array<string | number> };
    lists: { [key: string]: Array<string | number> };
    broadcasts: { [key: string]: string };
    blocks: { [key: string]: Block };
    comments: {
        [key: string]: {
            blockId: string;
            x: number;
            y: number;
            width: number;
            height: number;
            minimized: boolean;
            text: string;
        };
    };
    currentCostume: number;
    costumes: JSONValue;
    sounds: JSONValue;
    volume: number;
    layerOrder: number;
    tempo: number;
    videoTransparency?: number;
    videoState: string;
    textToSpeechLanguage: string;
};

export type ScratchProject = {
    targets: Target[];
    monitors: Monitor[];
    extensions: string[];
    meta: {
        semver: string;
        vm: string;
        agent: string;
    };
};
