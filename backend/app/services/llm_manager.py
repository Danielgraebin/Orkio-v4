"""
LLM Manager - Multi-provider support with GPT-5 ready
Supports: OpenAI, Anthropic, Google
"""
import os
import logging
from typing import List, Dict, Tuple, Optional

logger = logging.getLogger(__name__)

# Load allowed models from environment
OPENAI_MODELS = [
    m.strip() for m in os.getenv(
        "OPENAI_ALLOWED_MODELS", 
        "gpt-4o-mini,gpt-4.1,gpt-4.1-mini,gpt-4.1-nano,gpt-5,gpt-5-turbo,gpt-5-large,gemini-2.5-flash"
    ).split(",") if m.strip()
]

ANTHROPIC_MODELS = [
    m.strip() for m in os.getenv(
        "ANTHROPIC_ALLOWED_MODELS",
        "claude-3.5-haiku,claude-3.5-sonnet,claude-3-opus"
    ).split(",") if m.strip()
]

GOOGLE_MODELS = [
    m.strip() for m in os.getenv(
        "GOOGLE_ALLOWED_MODELS",
        "gemini-1.5-pro,gemini-1.5-flash,gemini-2.0-flash"
    ).split(",") if m.strip()
]

DEFAULT_MODEL = os.getenv("OPENAI_MODEL_DEFAULT", "gpt-4o-mini")

def resolve_model(requested: Optional[str]) -> Tuple[str, str]:
    """
    Resolve model name to (model, provider) tuple.
    
    Args:
        requested: Model name requested (e.g., "gpt-5", "claude-3.5-sonnet")
    
    Returns:
        Tuple of (model_name, provider_name)
    
    Examples:
        >>> resolve_model("gpt-5")
        ("gpt-5", "openai")
        >>> resolve_model("claude-3.5-sonnet")
        ("claude-3.5-sonnet", "anthropic")
        >>> resolve_model(None)
        ("gpt-4o-mini", "openai")
    """
    if not requested:
        return DEFAULT_MODEL, "openai"
    
    # Check OpenAI models
    if requested in OPENAI_MODELS:
        return requested, "openai"
    
    # Check Anthropic models
    if requested in ANTHROPIC_MODELS:
        return requested, "anthropic"
    
    # Check Google models
    if requested in GOOGLE_MODELS:
        return requested, "google"
    
    # Fallback to default
    logger.warning(f"Model '{requested}' not found in allowed models, using default: {DEFAULT_MODEL}")
    return DEFAULT_MODEL, "openai"

def get_available_models() -> Dict[str, List[str]]:
    """
    Get all available models grouped by provider.
    
    Returns:
        Dict with provider names as keys and model lists as values
    """
    return {
        "openai": OPENAI_MODELS,
        "anthropic": ANTHROPIC_MODELS,
        "google": GOOGLE_MODELS
    }

def chat_completion(
    messages: List[Dict[str, str]], 
    model: Optional[str] = None, 
    temperature: float = 0.5,
    max_tokens: Optional[int] = None
) -> str:
    """
    Universal chat completion function supporting multiple providers.
    
    Args:
        messages: List of message dicts with 'role' and 'content'
        model: Model name (will be resolved to provider)
        temperature: Temperature for generation (0.0 to 1.0)
        max_tokens: Maximum tokens to generate
    
    Returns:
        Generated text response
    
    Raises:
        Exception: If API call fails
    """
    final_model, provider = resolve_model(model)
    
    logger.info(f"Chat completion: model={final_model}, provider={provider}, temp={temperature}")
    
    if provider == "openai":
        return _chat_openai(messages, final_model, temperature, max_tokens)
    
    elif provider == "anthropic":
        return _chat_anthropic(messages, final_model, temperature, max_tokens)
    
    elif provider == "google":
        return _chat_google(messages, final_model, temperature, max_tokens)
    
    else:
        raise ValueError(f"Unknown provider: {provider}")

def _chat_openai(
    messages: List[Dict[str, str]], 
    model: str, 
    temperature: float,
    max_tokens: Optional[int]
) -> str:
    """OpenAI chat completion via HTTP with retries and clear errors (P0 patch)"""
    import requests
    import time
    
    api_key = os.getenv("OPENAI_API_KEY")
    api_base = os.getenv("OPENAI_API_BASE", "https://api.openai.com/v1")
    llm_timeout = int(os.getenv("ORKIO_LLM_TIMEOUT", "60"))
    llm_retries = int(os.getenv("ORKIO_LLM_RETRIES", "2"))
    
    if not api_key:
        raise ValueError("OPENAI_API_KEY not set")
    
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "model": model,
        "messages": messages,
        "temperature": temperature
    }
    
    if max_tokens:
        payload["max_tokens"] = max_tokens
    
    last_error = None
    for attempt in range(llm_retries + 1):
        try:
            response = requests.post(
                f"{api_base}/chat/completions",
                headers=headers,
                json=payload,
                timeout=llm_timeout
            )
            
            # Success
            if response.status_code == 200:
                result = response.json()
                return result["choices"][0]["message"]["content"]
            
            # Non-200: log and raise with clear error
            error_body = response.text[:500]  # Truncate for safety
            logger.error(f"OpenAI API error: status={response.status_code}, body={error_body}")
            
            # Don't retry on 4xx (client errors)
            if 400 <= response.status_code < 500:
                raise ValueError(f"OpenAI API error {response.status_code}: {error_body}")
            
            # Retry on 5xx (server errors)
            last_error = f"OpenAI API error {response.status_code}: {error_body}"
            
        except requests.exceptions.Timeout as e:
            last_error = f"OpenAI API timeout after {llm_timeout}s: {repr(e)}"
            logger.warning(f"Attempt {attempt+1}/{llm_retries+1}: {last_error}")
            
        except requests.exceptions.RequestException as e:
            last_error = f"OpenAI API request exception: {repr(e)}"
            logger.warning(f"Attempt {attempt+1}/{llm_retries+1}: {last_error}")
        
        # Exponential backoff before retry
        if attempt < llm_retries:
            sleep_time = 2 ** attempt
            logger.info(f"Retrying in {sleep_time}s...")
            time.sleep(sleep_time)
    
    # All retries exhausted
    logger.error(f"OpenAI API failed after {llm_retries+1} attempts: {last_error}")
    raise Exception(f"OpenAI API failed: {last_error}")

def _chat_anthropic(
    messages: List[Dict[str, str]], 
    model: str, 
    temperature: float,
    max_tokens: Optional[int]
) -> str:
    """Anthropic (Claude) chat completion"""
    try:
        import anthropic
        
        client = anthropic.Anthropic(
            api_key=os.getenv("ANTHROPIC_API_KEY")
        )
        
        # Convert messages format
        system_message = None
        converted_messages = []
        
        for msg in messages:
            if msg["role"] == "system":
                system_message = msg["content"]
            else:
                converted_messages.append({
                    "role": msg["role"],
                    "content": msg["content"]
                })
        
        kwargs = {
            "model": model,
            "messages": converted_messages,
            "temperature": temperature,
            "max_tokens": max_tokens or 1024
        }
        
        if system_message:
            kwargs["system"] = system_message
        
        response = client.messages.create(**kwargs)
        return response.content[0].text
        
    except Exception as e:
        logger.error(f"Anthropic API error: {e}")
        raise

def _chat_google(
    messages: List[Dict[str, str]], 
    model: str, 
    temperature: float,
    max_tokens: Optional[int]
) -> str:
    """Google (Gemini) chat completion"""
    try:
        import google.generativeai as genai
        
        genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))
        
        # Convert messages format
        history = []
        last_message = None
        
        for msg in messages:
            if msg["role"] == "system":
                # Gemini doesn't have system role, prepend to first user message
                continue
            elif msg["role"] == "user":
                last_message = msg["content"]
            elif msg["role"] == "assistant":
                if last_message:
                    history.append({
                        "role": "user",
                        "parts": [last_message]
                    })
                    last_message = None
                history.append({
                    "role": "model",
                    "parts": [msg["content"]]
                })
        
        model_obj = genai.GenerativeModel(model)
        
        generation_config = {
            "temperature": temperature,
        }
        
        if max_tokens:
            generation_config["max_output_tokens"] = max_tokens
        
        chat = model_obj.start_chat(history=history)
        response = chat.send_message(
            last_message or messages[-1]["content"],
            generation_config=generation_config
        )
        
        return response.text
        
    except Exception as e:
        logger.error(f"Google API error: {e}")
        raise

