import { authenticate } from 'utils/authUtils';
import { findModel } from 'utils/modelUtils';

export default async function (req, res) {
  const { modelName } = req.query;

  try {
    const authResult = authenticate(req);
    if (!authResult.success) {
      res.status(401).json({
        success: false,
        error: authResult.error
      });
      return;
    }
    const authUser = authResult.user;

    // Check if role exists in user roles
    const model = await findModel(modelName, authUser.username);
    if (!model) {
      res.status(404).json({
        success: false,
        error: "Model not exists."
      });
      return;
    }

    res.status(200).json({
      success: true,
      result: {
        model:                   model.name,
        provider:                model.provider,
        owner:                   model.owner,
        base_url:                model.base_url,
        api_key:                 "***",
        price_input:             model.price_input,
        price_output:            model.price_output,
        is_tool_calls_supported: model.is_tool_calls_supported,
        is_vision:               model.is_vision,
        is_audio:                model.is_audio,
        is_reasoning:            model.is_reasoning,
        is_image:                model.is_image,
        context_window:          model.context_window,
        max_output:              model.max_output,
        created_by:              model.created_by,
        created_at:              model.created_at,
        updated_at:              model.updated_at,
      },
    });
    return;
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: "An error occurred during your request."
    });
  }
}
